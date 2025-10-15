import React from 'react';
import { DocumentIcon } from '@heroicons/react/24/outline';

/**
 * Loading skeleton for file list
 */
export const FileListLoading: React.FC = () => (
  <div className="p-6">
    <div className="animate-pulse space-y-4">
      <div className="h-4 bg-gray-200 rounded w-1/4"></div>
      <div className="space-y-3">
        <div className="h-8 bg-gray-200 rounded"></div>
        <div className="h-8 bg-gray-200 rounded"></div>
        <div className="h-8 bg-gray-200 rounded"></div>
      </div>
    </div>
  </div>
);

/**
 * Error state for file list
 */
export const FileListError: React.FC = () => (
  <div className="p-6">
    <div className="bg-red-50 border-l-4 border-red-400 p-4">
      <div className="flex">
        <div className="flex-shrink-0">
          <svg
            className="h-5 w-5 text-red-400"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
              clipRule="evenodd"
            />
          </svg>
        </div>
        <div className="ml-3">
          <p className="text-sm text-red-700">
            Failed to load files. Please try again.
          </p>
        </div>
      </div>
    </div>
  </div>
);

interface FileListEmptyProps {
  hasActiveFilters: boolean;
}

/**
 * Empty state for file list
 */
export const FileListEmpty: React.FC<FileListEmptyProps> = ({ hasActiveFilters }) => (
  <div className="text-center py-12">
    <DocumentIcon className="mx-auto h-12 w-12 text-gray-400" />
    <h3 className="mt-2 text-sm font-medium text-gray-900">No files</h3>
    <p className="mt-1 text-sm text-gray-500">
      {hasActiveFilters
        ? 'No files match your filters'
        : 'Get started by uploading a file'}
    </p>
  </div>
);
