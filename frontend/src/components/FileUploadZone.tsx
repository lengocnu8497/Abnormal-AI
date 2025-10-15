import React from 'react';
import { UPLOAD_CONFIG } from '../utils/fileUploadHelpers';

interface FileUploadZoneProps {
  onFileSelect: (event: React.ChangeEvent<HTMLInputElement>) => void;
  disabled: boolean;
}

/**
 * Drag-and-drop file upload zone
 */
export const FileUploadZone: React.FC<FileUploadZoneProps> = ({ onFileSelect, disabled }) => {
  return (
    <div className="flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg">
      <div className="space-y-1 text-center">
        <div className="flex text-sm text-gray-600">
          <label
            htmlFor="file-upload"
            className="relative cursor-pointer bg-white rounded-md font-medium text-primary-600 hover:text-primary-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-primary-500"
          >
            <span>Upload a file</span>
            <input
              id="file-upload"
              name="file-upload"
              type="file"
              className="sr-only"
              onChange={onFileSelect}
              disabled={disabled}
              aria-label="Select file to upload"
            />
          </label>
          <p className="pl-1">or drag and drop</p>
        </div>
        <p className="text-xs text-gray-500">
          Files up to {UPLOAD_CONFIG.CHUNK_THRESHOLD_MB}MB use standard upload, larger files use chunked upload
        </p>
      </div>
    </div>
  );
};
