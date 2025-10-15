import axios from 'axios';
import { File as FileType, StorageSavingsSummary } from '../types/file';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

export const fileService = {
  async uploadFile(file: File): Promise<FileType> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await axios.post(`${API_URL}/files/`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  async getFiles(): Promise<FileType[]> {
    const response = await axios.get(`${API_URL}/files/`);
    return response.data;
  },

  async deleteFile(id: string): Promise<void> {
    await axios.delete(`${API_URL}/files/${id}/`);
  },

  async downloadFile(fileUrl: string, filename: string): Promise<void> {
    try {
      const response = await axios.get(fileUrl, {
        responseType: 'blob',
      });

      // Create a blob URL and trigger download
      const blob = new Blob([response.data]);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download error:', error);
      throw new Error('Failed to download file');
    }
  },

  async getWeeklySummary(): Promise<StorageSavingsSummary> {
    const response = await axios.get(`${API_URL}/summaries/weekly/`);
    return response.data;
  },

  async getYearlySummary(): Promise<StorageSavingsSummary> {
    const response = await axios.get(`${API_URL}/summaries/yearly/`);
    return response.data;
  },

  async uploadFileInChunks(
    file: File,
    onProgress?: (progress: number) => void
  ): Promise<FileType> {
    const CHUNK_SIZE = 1024 * 1024; // 1MB chunks
    const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
    const uploadId = `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;

    for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
      const start = chunkIndex * CHUNK_SIZE;
      const end = Math.min(start + CHUNK_SIZE, file.size);
      const chunk = file.slice(start, end);

      const formData = new FormData();
      formData.append('chunk', chunk);
      formData.append('chunk_index', chunkIndex.toString());
      formData.append('total_chunks', totalChunks.toString());
      formData.append('upload_id', uploadId);
      formData.append('filename', file.name);
      formData.append('file_type', file.type || 'application/octet-stream');

      const response = await axios.post(`${API_URL}/files/upload-chunk/`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      // Update progress
      if (onProgress) {
        const progress = Math.round(((chunkIndex + 1) / totalChunks) * 100);
        onProgress(progress);
      }

      // If upload is complete, return the file data
      if (response.data.complete) {
        return response.data.file;
      }
    }

    throw new Error('Upload failed: all chunks sent but no completion response');
  },
}; 