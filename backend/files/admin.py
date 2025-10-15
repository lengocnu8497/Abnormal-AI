from django.contrib import admin
from .models import FileContent, File, DeduplicationEvent, StorageSavingsSummary


@admin.register(FileContent)
class FileContentAdmin(admin.ModelAdmin):
    list_display = ['content_hash_short', 'size_mb', 'reference_count', 'created_at']
    search_fields = ['content_hash']
    list_filter = ['created_at']
    readonly_fields = ['content_hash', 'size', 'reference_count', 'created_at']

    def content_hash_short(self, obj):
        return f"{obj.content_hash[:16]}..."
    content_hash_short.short_description = 'Content Hash'

    def size_mb(self, obj):
        return f"{obj.size / (1024 * 1024):.2f} MB"
    size_mb.short_description = 'Size'


@admin.register(File)
class FileAdmin(admin.ModelAdmin):
    list_display = ['original_filename', 'file_type', 'size_display', 'uploaded_at']
    search_fields = ['original_filename', 'file_type']
    list_filter = ['file_type', 'uploaded_at']
    readonly_fields = ['id', 'uploaded_at']

    def size_display(self, obj):
        return f"{obj.size / (1024 * 1024):.2f} MB"
    size_display.short_description = 'Size'


@admin.register(DeduplicationEvent)
class DeduplicationEventAdmin(admin.ModelAdmin):
    list_display = ['original_filename', 'file_type', 'file_size_mb', 'detected_at']
    search_fields = ['original_filename', 'file_type']
    list_filter = ['file_type', 'detected_at']
    readonly_fields = ['file_content', 'file_reference', 'original_filename', 'file_size', 'file_type', 'detected_at']
    date_hierarchy = 'detected_at'

    def file_size_mb(self, obj):
        return f"{obj.file_size / (1024 * 1024):.2f} MB"
    file_size_mb.short_description = 'Storage Saved'


@admin.register(StorageSavingsSummary)
class StorageSavingsSummaryAdmin(admin.ModelAdmin):
    list_display = [
        'period_display',
        'period_type',
        'total_duplicates_detected',
        'storage_saved_gb',
        'unique_files_shared',
        'most_duplicated_type',
        'updated_at'
    ]
    list_filter = ['period_start', 'period_end']
    readonly_fields = [
        'period_start',
        'period_end',
        'total_duplicates_detected',
        'total_storage_saved_bytes',
        'storage_saved_mb',
        'storage_saved_gb',
        'unique_files_shared',
        'most_duplicated_type',
        'updated_at',
        'is_weekly_summary',
        'is_yearly_summary'
    ]

    def period_display(self, obj):
        return f"{obj.period_start} to {obj.period_end}"
    period_display.short_description = 'Period'

    def period_type(self, obj):
        if obj.is_weekly_summary:
            return "📅 Weekly"
        elif obj.is_yearly_summary:
            return "📆 Yearly"
        else:
            delta = obj.period_end - obj.period_start
            return f"Custom ({delta.days + 1} days)"
    period_type.short_description = 'Type'

    actions = ['recalculate_summaries']

    def recalculate_summaries(self, request, queryset):
        for summary in queryset:
            summary.recalculate()
        self.message_user(request, f"Recalculated {queryset.count()} summaries.")
    recalculate_summaries.short_description = "Recalculate selected summaries"
