import React, { useCallback } from 'react';
import { FixedSizeList } from 'react-window';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fileService } from '../services/fileService';
import { filterFiles } from '../utils/fileFilters';
import { FileRow } from './FileRow';
import { FileListLoading, FileListError, FileListEmpty } from './FileListStates';

interface FileListProps {
  searchQuery?: string;
  fileTypeFilter?: string;
  sizeRangeFilter?: string;
  uploadDateFilter?: string;
}

/**
 * Constants for virtual list configuration
 */
const VIRTUAL_LIST_CONFIG = {
  HEIGHT: 600,
  ITEM_SIZE: 120,
} as const;

/**
 * FileList component with virtual scrolling
 * Displays a filtered list of uploaded files with download and delete actions
 */
export const FileList: React.FC<FileListProps> = ({
  searchQuery = '',
  fileTypeFilter = 'all',
  sizeRangeFilter = 'all',
  uploadDateFilter = '',
}) => {
  const queryClient = useQueryClient();

  // Fetch files query
  const { data: files, isLoading, error } = useQuery({
    queryKey: ['files'],
    queryFn: fileService.getFiles,
  });

  // Delete file mutation
  const deleteMutation = useMutation({
    mutationFn: fileService.deleteFile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['files'] });
    },
  });

  // Download file mutation
  const downloadMutation = useMutation({
    mutationFn: ({ fileUrl, filename }: { fileUrl: string; filename: string }) =>
      fileService.downloadFile(fileUrl, filename),
  });

  // Filter files based on all criteria
  const filteredFiles = filterFiles(files, {
    searchQuery,
    fileTypeFilter,
    sizeRangeFilter,
    uploadDateFilter,
  });

  // Event handlers
  const handleDelete = useCallback(
    async (id: string) => {
      try {
        await deleteMutation.mutateAsync(id);
      } catch (err) {
        console.error('Delete error:', err);
      }
    },
    [deleteMutation]
  );

  const handleDownload = useCallback(
    async (fileUrl: string, filename: string) => {
      try {
        await downloadMutation.mutateAsync({ fileUrl, filename });
      } catch (err) {
        console.error('Download error:', err);
      }
    },
    [downloadMutation]
  );

  // Check if any filters are active
  const hasActiveFilters =
    searchQuery !== '' ||
    fileTypeFilter !== 'all' ||
    sizeRangeFilter !== 'all' ||
    uploadDateFilter !== '';

  // Row renderer for virtual list
  const renderFileRow = useCallback(
    ({ index, style }: { index: number; style: React.CSSProperties }) => {
      const file = filteredFiles[index];

      return (
        <FileRow
          file={file}
          style={style}
          onDownload={handleDownload}
          onDelete={handleDelete}
          isDownloading={downloadMutation.isPending}
          isDeleting={deleteMutation.isPending}
        />
      );
    },
    [filteredFiles, handleDownload, handleDelete, downloadMutation.isPending, deleteMutation.isPending]
  );

  // Loading state
  if (isLoading) {
    return <FileListLoading />;
  }

  // Error state
  if (error) {
    return <FileListError />;
  }

  // Render file list
  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">Uploaded Files</h2>

      {filteredFiles.length === 0 ? (
        <FileListEmpty hasActiveFilters={hasActiveFilters} />
      ) : (
        <div className="mt-6">
          <FixedSizeList
            height={VIRTUAL_LIST_CONFIG.HEIGHT}
            itemCount={filteredFiles.length}
            itemSize={VIRTUAL_LIST_CONFIG.ITEM_SIZE}
            width="100%"
            className="border border-gray-200 rounded-lg"
          >
            {renderFileRow}
          </FixedSizeList>
        </div>
      )}
    </div>
  );
}; 