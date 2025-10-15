from django.core.files.base import ContentFile
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import File, FileContent, DeduplicationEvent, StorageSavingsSummary
from django.db import IntegrityError
from .serializers import FileSerializer, StorageSavingsSummarySerializer
from .utils import calculate_file_hash
import hashlib

# Create your views here.

class FileViewSet(viewsets.ModelViewSet):
    queryset = File.objects.all()
    serializer_class = FileSerializer

    def get_serializer_context(self):
        """Add request to serializer context for building absolute URLs"""
        context = super().get_serializer_context()
        context['request'] = self.request
        return context

    def create(self, request, *args, **kwargs):
        """Handle file upload with deduplication"""
        file_obj = request.FILES.get('file')
        if not file_obj:
            return Response({'error': 'No file provided'}, status=status.HTTP_400_BAD_REQUEST)

        # Calculate content hash
        content_hash = calculate_file_hash(file_obj)

        # Check if FileContent with this hash already exists
        try:
            file_content, created = FileContent.objects.get_or_create(
                content_hash=content_hash,
                defaults={
                    'size': file_obj.size,
                    'reference_count': 0
                }
            )
        except IntegrityError:
            # Race: another process created it between check and create — refetch
            file_content = FileContent.objects.get(content_hash=content_hash)
            created = False

        if created:
            # New content - save the file
            file_content.file.save(content_hash, file_obj, save=True)

        # Increment reference count
        file_content.increment_reference()

        # Create File metadata record
        file_record = File.objects.create(
            file_content=file_content,
            original_filename=file_obj.name,
            file_type=file_obj.content_type or 'application/octet-stream'
        )

        # If duplicate detected, record the deduplication event
        if not created:
            DeduplicationEvent.objects.create(
                file_content=file_content,
                file_reference=file_record,
                original_filename=file_obj.name,
                file_size=file_obj.size,
                file_type=file_obj.content_type or 'application/octet-stream'
            )

            # Update storage savings summary
            StorageSavingsSummary.update_current_summary(
                file_size=file_obj.size,
                file_type=file_obj.content_type or 'application/octet-stream'
            )

        serializer = self.get_serializer(file_record)

        headers = self.get_success_headers(serializer.data)
        response_data = serializer.data
        response_data['is_duplicate'] = not created

        return Response(response_data, status=status.HTTP_201_CREATED, headers=headers)

    def destroy(self, request, *args, **kwargs):
        """Handle file deletion with reference counting"""
        instance = self.get_object()
        file_content = instance.file_content

        # Delete the File record
        instance.delete()

        # Decrement reference count (FileContent will auto-delete if count reaches 0)
        file_content.decrement_reference()

        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=False, methods=['post'], url_path='upload-chunk')
    def upload_chunk(self, request):
        """Handle chunked file upload"""
        chunk = request.FILES.get('chunk')
        chunk_index = int(request.data.get('chunk_index', 0))
        total_chunks = int(request.data.get('total_chunks', 1))
        upload_id = request.data.get('upload_id')
        filename = request.data.get('filename')
        file_type = request.data.get('file_type', 'application/octet-stream')

        if not chunk or not upload_id:
            return Response({'error': 'Missing chunk or upload_id'}, status=status.HTTP_400_BAD_REQUEST)

        # Store chunk temporarily using Django's cache or session
        # For simplicity, we'll use session storage
        session_key = f'upload_{upload_id}'

        if session_key not in request.session:
            request.session[session_key] = {
                'chunks': {},
                'filename': filename,
                'file_type': file_type,
                'total_chunks': total_chunks
            }

        # Read and store chunk data
        chunk_data = chunk.read()
        request.session[session_key]['chunks'][chunk_index] = chunk_data
        request.session.modified = True

        # Check if all chunks received
        upload_data = request.session[session_key]
        if len(upload_data['chunks']) == total_chunks:
            # Reassemble file
            complete_data = b''
            for i in range(total_chunks):
                complete_data += upload_data['chunks'][i]

            # Calculate hash of complete file
            sha256 = hashlib.sha256()
            sha256.update(complete_data)
            content_hash = sha256.hexdigest()

            # Check for deduplication
            try:
                file_content, created = FileContent.objects.get_or_create(
                    content_hash=content_hash,
                    defaults={
                        'size': len(complete_data),
                        'reference_count': 0
                    }
                )
            except IntegrityError:
                file_content = FileContent.objects.get(content_hash=content_hash)
                created = False

            if created:
                # Save the complete file
                file_content.file.save(
                    content_hash,
                    ContentFile(complete_data),
                    save=True
                )

            # Increment reference count
            file_content.increment_reference()

            # Create File record
            file_record = File.objects.create(
                file_content=file_content,
                original_filename=upload_data['filename'],
                file_type=upload_data['file_type']
            )

            # If duplicate detected, record the deduplication event
            if not created:
                DeduplicationEvent.objects.create(
                    file_content=file_content,
                    file_reference=file_record,
                    original_filename=upload_data['filename'],
                    file_size=len(complete_data),
                    file_type=upload_data['file_type']
                )

                # Update storage savings summary
                StorageSavingsSummary.update_current_summary(
                    file_size=len(complete_data),
                    file_type=upload_data['file_type']
                )

            # Clean up session
            del request.session[session_key]
            request.session.modified = True

            serializer = self.get_serializer(file_record)
            return Response({
                'complete': True,
                'is_duplicate': not created,
                'file': serializer.data
            }, status=status.HTTP_201_CREATED)

        # More chunks expected
        return Response({
            'complete': False,
            'received_chunks': len(upload_data['chunks']),
            'total_chunks': total_chunks
        }, status=status.HTTP_200_OK)

    # ...existing file-related actions...


class SummaryViewSet(viewsets.ViewSet):
    """Provides endpoints for weekly and yearly storage summaries."""

    def list(self, request):
        return Response({'detail': 'use /weekly/ or /yearly/'}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['get'], url_path='weekly')
    def weekly(self, request):
        week_start, week_end = StorageSavingsSummary.get_current_week_dates()
        summary = StorageSavingsSummary._get_or_create_summary(week_start, week_end)
        summary.recalculate()
        serializer = StorageSavingsSummarySerializer(summary, context={'request': request})
        return Response(serializer.data)

    @action(detail=False, methods=['get'], url_path='yearly')
    def yearly(self, request):
        from datetime import date
        today = date.today()
        year_start = date(today.year, 1, 1)
        year_end = date(today.year, 12, 31)
        summary = StorageSavingsSummary._get_or_create_summary(year_start, year_end)
        summary.recalculate()
        serializer = StorageSavingsSummarySerializer(summary, context={'request': request})
        return Response(serializer.data)
