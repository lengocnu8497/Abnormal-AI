import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { ChartBarIcon } from '@heroicons/react/24/outline';
import { fileService } from '../services/fileService';
import { SummaryCard } from './SummaryCard';
import { StorageSavingsLoading, StorageSavingsError } from './StorageSavingsStates';

/**
 * Refetch interval for summary data (1 minute)
 */
const REFETCH_INTERVAL = 60000;

/**
 * Storage Savings Card Component
 * Displays weekly and yearly storage savings statistics with auto-refresh
 */
export const StorageSavingsCard: React.FC = () => {
  // Fetch weekly summary
  const { data: weeklySummary, isLoading: weeklyLoading, error: weeklyError } = useQuery({
    queryKey: ['storageSummary', 'weekly'],
    queryFn: fileService.getWeeklySummary,
    refetchInterval: REFETCH_INTERVAL,
  });

  // Fetch yearly summary
  const { data: yearlySummary, isLoading: yearlyLoading, error: yearlyError } = useQuery({
    queryKey: ['storageSummary', 'yearly'],
    queryFn: fileService.getYearlySummary,
    refetchInterval: REFETCH_INTERVAL,
  });

  const isLoading = weeklyLoading || yearlyLoading;
  const hasError = weeklyError || yearlyError;

  // Loading state
  if (isLoading) {
    return <StorageSavingsLoading />;
  }

  // Error state
  if (hasError) {
    return <StorageSavingsError />;
  }

  // Main content
  return (
    <div className="bg-white shadow sm:rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        {/* Header */}
        <div className="flex items-center mb-4">
          <ChartBarIcon className="h-6 w-6 text-blue-600 mr-2" />
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            Storage Savings Summary
          </h3>
        </div>

        {/* Summary Cards Grid */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <SummaryCard
            title="This Week"
            summary={weeklySummary}
            colorScheme="blue"
          />
          <SummaryCard
            title="This Year"
            summary={yearlySummary}
            colorScheme="green"
          />
        </div>
      </div>
    </div>
  );
};
