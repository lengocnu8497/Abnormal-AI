import React from 'react';
import { CalendarIcon, DocumentDuplicateIcon, CloudArrowUpIcon } from '@heroicons/react/24/outline';
import { StorageSavingsSummary } from '../types/file';

interface SummaryCardProps {
  title: string;
  summary: StorageSavingsSummary | undefined;
  colorScheme: 'blue' | 'green';
}

/**
 * Theme configurations for different color schemes
 */
const themes = {
  blue: {
    bg: 'from-blue-50 to-blue-100',
    border: 'border-blue-200',
    text: {
      primary: 'text-blue-900',
      secondary: 'text-blue-700',
      tertiary: 'text-blue-600',
    },
    icon: 'text-blue-600',
    divider: 'border-blue-200',
  },
  green: {
    bg: 'from-green-50 to-green-100',
    border: 'border-green-200',
    text: {
      primary: 'text-green-900',
      secondary: 'text-green-700',
      tertiary: 'text-green-600',
    },
    icon: 'text-green-600',
    divider: 'border-green-200',
  },
} as const;

/**
 * Individual summary card for weekly or yearly statistics
 */
export const SummaryCard: React.FC<SummaryCardProps> = ({ title, summary, colorScheme }) => {
  if (!summary) return null;

  const theme = themes[colorScheme];

  const storageSaved = summary.storage_saved_gb >= 1
    ? summary.storage_saved_gb_display
    : summary.storage_saved_mb_display;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className={`bg-gradient-to-br ${theme.bg} rounded-lg p-5 border ${theme.border}`}>
      {/* Header */}
      <div className="flex items-center mb-3">
        <CalendarIcon className={`h-5 w-5 ${theme.icon} mr-2`} />
        <h4 className={`text-sm font-semibold ${theme.text.primary}`}>{title}</h4>
      </div>

      <div className="space-y-3">
        {/* Storage Saved */}
        <div>
          <p className={`text-xs ${theme.text.secondary} mb-1`}>Storage Saved</p>
          <p className={`text-3xl font-bold ${theme.text.primary}`}>
            {storageSaved}
          </p>
        </div>

        {/* Statistics Grid */}
        <div className={`grid grid-cols-2 gap-3 pt-3 border-t ${theme.divider}`}>
          {/* Duplicates */}
          <div>
            <p className={`text-xs ${theme.text.secondary}`}>Duplicates</p>
            <div className="flex items-center mt-1">
              <DocumentDuplicateIcon className={`h-4 w-4 ${theme.icon} mr-1`} />
              <p className={`text-lg font-semibold ${theme.text.primary}`}>
                {summary.total_duplicates_detected}
              </p>
            </div>
          </div>

          {/* Unique Files */}
          <div>
            <p className={`text-xs ${theme.text.secondary}`}>Unique Files</p>
            <div className="flex items-center mt-1">
              <CloudArrowUpIcon className={`h-4 w-4 ${theme.icon} mr-1`} />
              <p className={`text-lg font-semibold ${theme.text.primary}`}>
                {summary.unique_files_shared}
              </p>
            </div>
          </div>
        </div>

        {/* Most Duplicated Type */}
        {summary.most_duplicated_type && (
          <div className={`pt-3 border-t ${theme.divider}`}>
            <p className={`text-xs ${theme.text.secondary}`}>Most Duplicated Type</p>
            <p className={`text-sm font-medium ${theme.text.primary} mt-1 truncate`}>
              {summary.most_duplicated_type}
            </p>
          </div>
        )}

        {/* Date Range */}
        <p className={`text-xs ${theme.text.tertiary} mt-2`}>
          {formatDate(summary.period_start)} - {formatDate(summary.period_end)}
        </p>
      </div>
    </div>
  );
};
