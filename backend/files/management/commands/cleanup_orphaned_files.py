from django.core.management.base import BaseCommand
from files.models import FileContent


class Command(BaseCommand):
    help = 'Clean up orphaned FileContent records with no references'

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Show what would be deleted without actually deleting',
        )

    def handle(self, *args, **options):
        dry_run = options['dry_run']

        # Find FileContent records with reference_count = 0 or no File references
        orphaned_by_count = FileContent.objects.filter(reference_count=0)
        orphaned_by_relation = FileContent.objects.filter(files__isnull=True)

        # Combine and get distinct records
        orphaned = (orphaned_by_count | orphaned_by_relation).distinct()

        count = orphaned.count()

        if count == 0:
            self.stdout.write(self.style.SUCCESS('No orphaned files found.'))
            return

        if dry_run:
            self.stdout.write(
                self.style.WARNING(
                    f'DRY RUN: Would delete {count} orphaned FileContent records:'
                )
            )
            for fc in orphaned:
                self.stdout.write(f'  - {fc.content_hash[:16]}... ({fc.size} bytes, refs: {fc.reference_count})')
        else:
            self.stdout.write(
                self.style.WARNING(
                    f'Deleting {count} orphaned FileContent records...'
                )
            )

            deleted_count = 0
            for fc in orphaned:
                hash_preview = fc.content_hash[:16]
                size = fc.size

                # Delete physical file
                if fc.file:
                    fc.file.delete(save=False)

                # Delete database record
                fc.delete()
                deleted_count += 1

                self.stdout.write(f'  Deleted {hash_preview}... ({size} bytes)')

            self.stdout.write(
                self.style.SUCCESS(
                    f'Successfully cleaned up {deleted_count} orphaned files.'
                )
            )
