/**
 * File upload configuration constants
 */
export const UPLOAD_CONFIG = {
  CHUNK_THRESHOLD_MB: 10,
  CHUNK_THRESHOLD_BYTES: 10 * 1024 * 1024, // 10MB
} as const;

/**
 * Format file size in MB
 */
export const formatFileSize = (sizeInBytes: number): string => {
  return (sizeInBytes / (1024 * 1024)).toFixed(2);
};

/**
 * Check if file should use chunked upload
 */
export const shouldUseChunkedUpload = (fileSizeInBytes: number): boolean => {
  return fileSizeInBytes > UPLOAD_CONFIG.CHUNK_THRESHOLD_BYTES;
};
