import React from 'react';
import { formatFileSize } from '../utils/fileUploadHelpers';

interface FileUploadInfoProps {
  file: File;
  isChunkedUpload: boolean;
}

/**
 * Display information about the selected file
 */
export const FileUploadInfo: React.FC<FileUploadInfoProps> = ({ file, isChunkedUpload }) => {
  return (
    <div className="space-y-2">
      <div className="text-sm text-gray-600">
        Selected: {file.name}
        {isChunkedUpload && (
          <span className="ml-2 text-xs text-blue-600 font-medium">
            (Large file - chunked upload)
          </span>
        )}
      </div>
      <div className="text-xs text-gray-500">
        Size: {formatFileSize(file.size)} MB
      </div>
    </div>
  );
};
