import { File as FileType } from '../types/file';

/**
 * File size ranges in bytes
 */
const SIZE_RANGES = {
  SMALL_MAX: 1024 * 1024, // 1MB
  MEDIUM_MAX: 5 * 1024 * 1024, // 5MB
} as const;

/**
 * Check if a MIME type matches the specified file type filter
 */
export const matchesFileType = (mimeType: string, filter: string): boolean => {
  if (filter === 'all') return true;

  switch (filter) {
    case 'image':
      return mimeType.startsWith('image/');

    case 'document':
      return (
        mimeType.includes('pdf') ||
        mimeType.includes('document') ||
        mimeType.includes('text') ||
        mimeType.includes('msword') ||
        mimeType.includes('wordprocessingml') ||
        mimeType.includes('spreadsheet') ||
        mimeType.includes('presentation')
      );

    case 'video':
      return mimeType.startsWith('video/');

    case 'other':
      return (
        !mimeType.startsWith('image/') &&
        !mimeType.startsWith('video/') &&
        !mimeType.includes('pdf') &&
        !mimeType.includes('document')
      );

    default:
      return true;
  }
};

/**
 * Check if a file size matches the specified size range filter
 */
export const matchesSizeRange = (sizeInBytes: number, filter: string): boolean => {
  if (filter === 'all') return true;

  switch (filter) {
    case 'small':
      return sizeInBytes < SIZE_RANGES.SMALL_MAX;

    case 'medium':
      return sizeInBytes >= SIZE_RANGES.SMALL_MAX && sizeInBytes <= SIZE_RANGES.MEDIUM_MAX;

    case 'large':
      return sizeInBytes > SIZE_RANGES.MEDIUM_MAX;

    default:
      return true;
  }
};

/**
 * Check if an upload date matches the specified date filter
 */
export const matchesUploadDate = (uploadDate: string, filterDate: string): boolean => {
  if (!filterDate) return true;

  const uploadDay = new Date(uploadDate).toISOString().split('T')[0];
  return uploadDay === filterDate;
};

/**
 * Check if a filename contains the search query (case-insensitive)
 */
export const matchesSearchQuery = (filename: string, searchQuery: string): boolean => {
  if (!searchQuery) return true;

  return filename.toLowerCase().includes(searchQuery.toLowerCase());
};

/**
 * Filter files based on all specified criteria
 */
export const filterFiles = (
  files: FileType[] | undefined,
  filters: {
    searchQuery: string;
    fileTypeFilter: string;
    sizeRangeFilter: string;
    uploadDateFilter: string;
  }
): FileType[] => {
  if (!files) return [];

  return files.filter((file) => {
    return (
      matchesSearchQuery(file.original_filename, filters.searchQuery) &&
      matchesFileType(file.file_type, filters.fileTypeFilter) &&
      matchesSizeRange(file.size, filters.sizeRangeFilter) &&
      matchesUploadDate(file.uploaded_at, filters.uploadDateFilter)
    );
  });
};
