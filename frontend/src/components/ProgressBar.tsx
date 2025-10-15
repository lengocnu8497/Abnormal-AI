import React from 'react';

interface ProgressBarProps {
  progress: number;
  label?: string;
}

/**
 * Progress bar component for file uploads
 * Displays a visual progress indicator with percentage
 */
export const ProgressBar: React.FC<ProgressBarProps> = ({ progress, label = 'Uploading...' }) => {
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm text-gray-600">
        <span>{label}</span>
        <span>{progress}%</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2.5">
        <div
          className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
          style={{ width: `${progress}%` }}
          role="progressbar"
          aria-valuenow={progress}
          aria-valuemin={0}
          aria-valuemax={100}
        ></div>
      </div>
    </div>
  );
};
