import React from 'react';
import { DocumentIcon, TrashIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import { File as FileType } from '../types/file';

interface FileRowProps {
  file: FileType;
  style: React.CSSProperties;
  onDownload: (fileUrl: string, filename: string) => void;
  onDelete: (id: string) => void;
  isDownloading: boolean;
  isDeleting: boolean;
}

/**
 * Individual file row component for virtual list
 * Displays file metadata and action buttons
 */
export const FileRow: React.FC<FileRowProps> = ({
  file,
  style,
  onDownload,
  onDelete,
  isDownloading,
  isDeleting,
}) => {
  const formatFileSize = (sizeInBytes: number): string => {
    return `${(sizeInBytes / 1024).toFixed(2)} KB`;
  };

  const formatUploadDate = (dateString: string): string => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <div style={style} className="border-b border-gray-200">
      <div className="py-4 px-6">
        <div className="flex items-center space-x-4">
          {/* File Icon */}
          <div className="flex-shrink-0">
            <DocumentIcon className="h-8 w-8 text-gray-400" />
          </div>

          {/* File Information */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {file.original_filename}
            </p>
            <p className="text-sm text-gray-500">
              {file.file_type} • {formatFileSize(file.size)}
            </p>
            <p className="text-sm text-gray-500">
              Uploaded {formatUploadDate(file.uploaded_at)}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-2">
            <button
              onClick={() => onDownload(file.file, file.original_filename)}
              disabled={isDownloading}
              className="inline-flex items-center px-3 py-2 border border-transparent shadow-sm text-sm leading-4 font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label={`Download ${file.original_filename}`}
            >
              <ArrowDownTrayIcon className="h-4 w-4 mr-1" />
              Download
            </button>

            <button
              onClick={() => onDelete(file.id)}
              disabled={isDeleting}
              className="inline-flex items-center px-3 py-2 border border-transparent shadow-sm text-sm leading-4 font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label={`Delete ${file.original_filename}`}
            >
              <TrashIcon className="h-4 w-4 mr-1" />
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
