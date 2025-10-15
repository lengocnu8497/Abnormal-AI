from rest_framework import serializers
from .models import File, FileContent
from .models import StorageSavingsSummary


class FileContentSerializer(serializers.ModelSerializer):
    class Meta:
        model = FileContent
        fields = ['content_hash', 'file', 'size', 'reference_count', 'created_at']
        read_only_fields = ['content_hash', 'reference_count', 'created_at']


class FileSerializer(serializers.ModelSerializer):
    # Use properties from File model that delegate to FileContent
    size = serializers.IntegerField(read_only=True)
    file = serializers.SerializerMethodField()

    class Meta:
        model = File
        fields = ['id', 'file', 'original_filename', 'file_type', 'size', 'uploaded_at']
        read_only_fields = ['id', 'uploaded_at', 'size']

    def get_file(self, obj):
        """Return the file URL from FileContent"""
        request = self.context.get('request')
        if request and obj.file_content.file:
            return request.build_absolute_uri(obj.file_content.file.url)
        return obj.file_content.file.url if obj.file_content.file else None 


class StorageSavingsSummarySerializer(serializers.ModelSerializer):
    storage_saved_mb = serializers.FloatField(read_only=True)
    storage_saved_gb = serializers.FloatField(read_only=True)
    storage_saved_mb_display = serializers.SerializerMethodField()
    storage_saved_gb_display = serializers.SerializerMethodField()

    class Meta:
        model = StorageSavingsSummary
        fields = [
            'period_start',
            'period_end',
            'total_duplicates_detected',
            'storage_saved_mb',
            'storage_saved_gb',
            'storage_saved_mb_display',
            'storage_saved_gb_display',
            'unique_files_shared',
            'most_duplicated_type',
            'updated_at',
        ]
        read_only_fields = fields

    def get_storage_saved_mb_display(self, obj):
        return f"{obj.storage_saved_mb:.2f} MB"

    def get_storage_saved_gb_display(self, obj):
        return f"{obj.storage_saved_gb:.2f} GB"