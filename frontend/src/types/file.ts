export interface File {
  id: string;
  original_filename: string;
  file_type: string;
  size: number;
  uploaded_at: string;
  file: string;
}

export interface StorageSavingsSummary {
  period_start: string;
  period_end: string;
  total_duplicates_detected: number;
  storage_saved_mb: number;
  storage_saved_gb: number;
  storage_saved_mb_display: string;
  storage_saved_gb_display: string;
  unique_files_shared: number;
  most_duplicated_type: string | null;
  updated_at: string;
} 