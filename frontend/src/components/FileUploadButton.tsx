import React from 'react';
import { LoadingSpinner } from './LoadingSpinner';

interface FileUploadButtonProps {
  onClick: () => void;
  disabled: boolean;
  isUploading: boolean;
}

/**
 * Upload button with loading state
 */
export const FileUploadButton: React.FC<FileUploadButtonProps> = ({
  onClick,
  disabled,
  isUploading,
}) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
        disabled
          ? 'bg-gray-300 cursor-not-allowed'
          : 'bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500'
      }`}
      aria-label={isUploading ? 'Uploading file' : 'Upload file'}
    >
      {isUploading ? (
        <>
          <LoadingSpinner size="md" className="-ml-1 mr-3 text-white" />
          Uploading...
        </>
      ) : (
        'Upload'
      )}
    </button>
  );
};
