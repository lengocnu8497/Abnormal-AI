import React, { useState, useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { CloudArrowUpIcon } from '@heroicons/react/24/outline';
import { fileService } from '../services/fileService';
import { shouldUseChunkedUpload } from '../utils/fileUploadHelpers';
import { FileUploadZone } from './FileUploadZone';
import { FileUploadInfo } from './FileUploadInfo';
import { FileUploadButton } from './FileUploadButton';
import { ProgressBar } from './ProgressBar';

interface FileUploadProps {
  onUploadSuccess: () => void;
}

/**
 * File upload component with support for both standard and chunked uploads
 * Automatically switches to chunked upload for files larger than 10MB
 */
export const FileUpload: React.FC<FileUploadProps> = ({ onUploadSuccess }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [isChunkedUpload, setIsChunkedUpload] = useState<boolean>(false);
  const queryClient = useQueryClient();

  // Standard upload mutation
  const uploadMutation = useMutation({
    mutationFn: fileService.uploadFile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['files'] });
      resetUploadState();
      onUploadSuccess();
    },
    onError: (error) => {
      handleUploadError(error);
    },
  });

  // Reset all upload state
  const resetUploadState = useCallback(() => {
    setSelectedFile(null);
    setError(null);
    setUploadProgress(0);
    setIsChunkedUpload(false);
  }, []);

  // Handle upload errors
  const handleUploadError = useCallback((error: unknown) => {
    setError('Failed to upload file. Please try again.');
    console.error('Upload error:', error);
    setUploadProgress(0);
  }, []);

  // Handle file selection
  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      setSelectedFile(file);
      setError(null);
      setUploadProgress(0);
      setIsChunkedUpload(shouldUseChunkedUpload(file.size));
    }
  }, []);

  // Handle file upload
  const handleUpload = useCallback(async () => {
    if (!selectedFile) {
      setError('Please select a file');
      return;
    }

    try {
      setError(null);
      setUploadProgress(0);

      if (isChunkedUpload) {
        // Chunked upload for large files
        await fileService.uploadFileInChunks(selectedFile, setUploadProgress);
        queryClient.invalidateQueries({ queryKey: ['files'] });
        resetUploadState();
        onUploadSuccess();
      } else {
        // Standard upload for small files
        await uploadMutation.mutateAsync(selectedFile);
      }
    } catch (err) {
      handleUploadError(err);
    }
  }, [selectedFile, isChunkedUpload, uploadMutation, queryClient, onUploadSuccess, resetUploadState, handleUploadError]);

  const isUploading = uploadMutation.isPending || uploadProgress > 0;

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center mb-4">
        <CloudArrowUpIcon className="h-6 w-6 text-primary-600 mr-2" />
        <h2 className="text-xl font-semibold text-gray-900">Upload File</h2>
      </div>

      {/* Upload Form */}
      <div className="mt-4 space-y-4">
        {/* File Selection Zone */}
        <FileUploadZone
          onFileSelect={handleFileSelect}
          disabled={uploadMutation.isPending}
        />

        {/* Selected File Info */}
        {selectedFile && (
          <FileUploadInfo file={selectedFile} isChunkedUpload={isChunkedUpload} />
        )}

        {/* Error Message */}
        {error && (
          <div className="text-sm text-red-600 bg-red-50 p-2 rounded" role="alert">
            {error}
          </div>
        )}

        {/* Upload Progress */}
        {uploadProgress > 0 && uploadProgress < 100 && (
          <ProgressBar progress={uploadProgress} />
        )}

        {/* Upload Button */}
        <FileUploadButton
          onClick={handleUpload}
          disabled={!selectedFile || isUploading}
          isUploading={isUploading}
        />
      </div>
    </div>
  );
}; 