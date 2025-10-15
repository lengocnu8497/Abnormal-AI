from django.db import models
from django.db.models import Sum
import uuid
import os
from django.db import transaction
from django.db.models import F

def content_upload_path(instance, filename):
    """Generate file path based on content hash"""
    # Use first 2 chars of hash for directory sharding
    prefix = instance.content_hash[:2]
    return os.path.join('content', prefix, instance.content_hash)


class FileContent(models.Model):
    """Stores the actual file content, deduplicated by hash"""
    content_hash = models.CharField(max_length=64, unique=True, primary_key=True)
    file = models.FileField(upload_to=content_upload_path)
    size = models.BigIntegerField()
    reference_count = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.content_hash[:8]}... ({self.reference_count} refs)"

    def increment_reference(self):
        """Increment reference count atomically to avoid race conditions."""
        # Use an F() update so concurrent increments are safe
        FileContent.objects.filter(pk=self.pk).update(reference_count=F('reference_count') + 1)
        # Refresh the instance so callers see the new value
        self.refresh_from_db(fields=['reference_count'])

    def decrement_reference(self):
        """Decrement reference count atomically and delete file when count reaches zero.

        Uses a transaction to avoid races. Physical file deletion is performed after the
        DB transaction commits using transaction.on_commit to avoid deleting files while
        the DB changes are not yet durable.
        """
        with transaction.atomic():
            # Lock this row for update and get current value
            current = FileContent.objects.select_for_update().get(pk=self.pk)
            if current.reference_count <= 1:
                # Capture filename and storage to delete the physical file after commit
                file_name = current.file.name

                def _delete_physical_and_row():
                    try:
                        # attempt to delete the physical file via storage backend
                        storage = current.file.storage
                        storage.delete(file_name)
                    except Exception:
                        # swallow storage errors here; cleanup command can be used later
                        pass
                    # remove DB row if still present
                    FileContent.objects.filter(pk=self.pk).delete()

                transaction.on_commit(_delete_physical_and_row)
            else:
                # Safe decrement using F() expression
                FileContent.objects.filter(pk=self.pk).update(reference_count=F('reference_count') - 1)
        # Refresh instance state
        try:
            self.refresh_from_db(fields=['reference_count'])
        except FileContent.DoesNotExist:
            # If row was deleted, swallow — instance no longer exists
            pass


class File(models.Model):
    """Stores file metadata and user references"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    file_content = models.ForeignKey(FileContent, on_delete=models.PROTECT, related_name='files')
    original_filename = models.CharField(max_length=255)
    file_type = models.CharField(max_length=100)
    uploaded_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-uploaded_at']

    def __str__(self):
        return self.original_filename

    @property
    def size(self):
        """Get file size from FileContent"""
        return self.file_content.size

    @property
    def file(self):
        """Get file URL from FileContent"""
        return self.file_content.file


class DeduplicationEvent(models.Model):
    """Tracks each time a duplicate file is detected during upload"""
    id = models.AutoField(primary_key=True)
    file_content = models.ForeignKey(
        FileContent,
        on_delete=models.CASCADE,
        related_name='deduplication_events',
        help_text='The FileContent that was reused (deduplicated)'
    )
    file_reference = models.ForeignKey(
        File,
        on_delete=models.CASCADE,
        related_name='deduplication_event',
        help_text='The File record created for this duplicate upload'
    )
    original_filename = models.CharField(max_length=255)
    file_size = models.BigIntegerField(help_text='Size of the duplicate file in bytes (storage saved)')
    file_type = models.CharField(max_length=100)
    detected_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-detected_at']
        indexes = [
            models.Index(fields=['-detected_at']),
            models.Index(fields=['file_type']),
        ]

    def __str__(self):
        return f"{self.original_filename} ({self.file_size} bytes saved at {self.detected_at})"


class StorageSavingsSummary(models.Model):
    """Aggregated statistics for storage savings"""
    period_start = models.DateField(help_text='Start of tracking period')
    period_end = models.DateField(help_text='End of tracking period')
    total_duplicates_detected = models.IntegerField(default=0)
    total_storage_saved_bytes = models.BigIntegerField(default=0)
    unique_files_shared = models.IntegerField(default=0)
    most_duplicated_type = models.CharField(max_length=100, null=True, blank=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-period_start']
        verbose_name_plural = 'Storage Savings Summaries'
        unique_together = [['period_start', 'period_end']]

    def __str__(self):
        period_type = "Weekly" if self.is_weekly_summary else "Yearly" if self.is_yearly_summary else "Custom"
        return f"{period_type}: {self.storage_saved_gb:.2f} GB ({self.period_start} to {self.period_end})"

    @property
    def storage_saved_mb(self):
        """Calculate MB from bytes"""
        return self.total_storage_saved_bytes / (1024 * 1024)

    @property
    def storage_saved_gb(self):
        """Calculate GB from bytes"""
        return self.total_storage_saved_bytes / (1024 * 1024 * 1024)

    @property
    def is_weekly_summary(self):
        """Check if this is a weekly summary (7 days)"""
        delta = self.period_end - self.period_start
        return delta.days == 6  # Monday to Sunday = 6 days difference

    @property
    def is_yearly_summary(self):
        """Check if this is a yearly summary"""
        return (self.period_start.month == 1 and self.period_start.day == 1 and
                self.period_end.month == 12 and self.period_end.day == 31)

    def _update_statistics(self, period_start, period_end):
        """Helper method to update statistics from events"""
        from django.db.models import Count

        events = DeduplicationEvent.objects.filter(
            detected_at__date__gte=period_start,
            detected_at__date__lte=period_end
        )

        # Calculate statistics
        self.unique_files_shared = events.values('file_content').distinct().count()

        type_stats = events.values('file_type').annotate(
            count=Count('id')
        ).order_by('-count').first()

        if type_stats:
            self.most_duplicated_type = type_stats['file_type']

    @classmethod
    def get_weekly_summaries(cls, limit=10):
        """Get the most recent weekly summaries (7-day periods)"""
        # Get summaries that are 7 days long (6 days difference)
        from django.db.models import F, ExpressionWrapper, fields

        return cls.objects.annotate(
            period_length=ExpressionWrapper(
                F('period_end') - F('period_start'),
                output_field=fields.DurationField()
            )
        ).filter(period_length__lte=7).order_by('-period_start')[:limit]

    @classmethod
    def get_yearly_summaries(cls):
        """Get all yearly summaries (full calendar years)"""
        return cls.objects.filter(
            period_start__month=1,
            period_start__day=1,
            period_end__month=12,
            period_end__day=31
        ).order_by('-period_start')

    def recalculate(self):
        """Recalculate summary statistics from DeduplicationEvent records"""
        from django.db.models import Count

        events = DeduplicationEvent.objects.filter(
            detected_at__date__gte=self.period_start,
            detected_at__date__lte=self.period_end
        )

        # Calculate totals
        stats = events.aggregate(
            total_duplicates=Count('id'),
            total_saved=Sum('file_size')
        )

        self.total_duplicates_detected = stats['total_duplicates'] or 0
        self.total_storage_saved_bytes = stats['total_saved'] or 0

        # Update statistics using helper method
        self._update_statistics(self.period_start, self.period_end)
        self.save()

    @classmethod
    def get_current_week_dates(cls):
        """Get the start and end dates for the current week (Monday to Sunday)"""
        from datetime import date, timedelta

        today = date.today()
        # Get Monday of current week (0 = Monday, 6 = Sunday)
        days_since_monday = today.weekday()
        week_start = today - timedelta(days=days_since_monday)
        week_end = week_start + timedelta(days=6)  # Sunday

        return week_start, week_end

    def _increment_stats(self, file_size, period_start, period_end):
        """Helper to increment stats for a summary"""
        self.total_duplicates_detected += 1
        self.total_storage_saved_bytes += file_size
        self._update_statistics(period_start, period_end)
        self.save()

    @classmethod
    def _get_or_create_summary(cls, period_start, period_end):
        """Helper to get or create a summary for a period"""
        summary, _ = cls.objects.get_or_create(
            period_start=period_start,
            period_end=period_end,
            defaults={
                'total_duplicates_detected': 0,
                'total_storage_saved_bytes': 0,
            }
        )
        return summary

    @classmethod
    def update_current_summary(cls, file_size, file_type):
        """Update weekly and yearly summaries with new deduplication event"""
        from datetime import date

        today = date.today()

        # Update weekly summary
        week_start, week_end = cls.get_current_week_dates()
        weekly_summary = cls._get_or_create_summary(week_start, week_end)
        weekly_summary._increment_stats(file_size, week_start, week_end)

        # Update yearly summary
        year_start = date(today.year, 1, 1)
        year_end = date(today.year, 12, 31)
        yearly_summary = cls._get_or_create_summary(year_start, year_end)
        yearly_summary._increment_stats(file_size, year_start, year_end)
