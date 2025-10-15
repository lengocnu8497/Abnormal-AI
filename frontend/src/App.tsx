import React, { useState, useEffect } from 'react';
import { FileUpload } from './components/FileUpload';
import { FileList } from './components/FileList';
import { StorageSavingsCard } from './components/StorageSavingsCard';

function App() {
  const [refreshKey, setRefreshKey] = useState(0);
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [fileTypeFilter, setFileTypeFilter] = useState('all');
  const [sizeRangeFilter, setSizeRangeFilter] = useState('all');
  const [uploadDateFilter, setUploadDateFilter] = useState('');

  // Debounce search input with 200ms delay
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      setSearchQuery(searchInput);
    }, 200);

    return () => {
      clearTimeout(debounceTimer);
    };
  }, [searchInput]);

  const handleUploadSuccess = () => {
    setRefreshKey(prev => prev + 1);
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchInput(event.target.value);
  };

  const handleFileTypeChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setFileTypeFilter(event.target.value);
  };

  const handleSizeRangeChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSizeRangeFilter(event.target.value);
  };

  const handleUploadDateChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setUploadDateFilter(event.target.value);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-gray-900">Abnormal Security - File Hub</h1>
          <p className="mt-1 text-sm text-gray-500">
            File management system
          </p>
        </div>
      </header>
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="space-y-6">
            <div className="bg-white shadow sm:rounded-lg">
              <FileUpload onUploadSuccess={handleUploadSuccess} />
            </div>

            {/* Filter Buttons Bar */}
            <div className="bg-white shadow sm:rounded-lg">
              <div className="p-4">
                <div className="space-y-4">
                  {/* Search Field */}
                  <div>
                    <label htmlFor="search-filename" className="block text-sm font-medium text-gray-700 mb-1">
                      Search File Name
                    </label>
                    <input
                      type="text"
                      id="search-filename"
                      placeholder="Search files..."
                      value={searchInput}
                      onChange={handleSearchChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  {/* Filters Row */}
                  <div className="flex gap-4">
                    {/* File Type Dropdown */}
                    <div className="flex-1">
                      <label htmlFor="file-type" className="block text-sm font-medium text-gray-700 mb-1">
                        File Type
                      </label>
                      <select
                        id="file-type"
                        value={fileTypeFilter}
                        onChange={handleFileTypeChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="all">All Types</option>
                        <option value="image">Images</option>
                        <option value="document">Documents</option>
                        <option value="video">Videos</option>
                        <option value="other">Other</option>
                      </select>
                    </div>

                    {/* Size Range Dropdown */}
                    <div className="flex-1">
                      <label htmlFor="size-range" className="block text-sm font-medium text-gray-700 mb-1">
                        Size Range
                      </label>
                      <select
                        id="size-range"
                        value={sizeRangeFilter}
                        onChange={handleSizeRangeChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="all">All Sizes</option>
                        <option value="small">Small (&lt; 1MB)</option>
                        <option value="medium">Medium (1-5MB)</option>
                        <option value="large">Large (&gt; 5MB)</option>
                      </select>
                    </div>

                    {/* Upload Date Calendar */}
                    <div className="flex-1">
                      <label htmlFor="upload-date" className="block text-sm font-medium text-gray-700 mb-1">
                        Upload Date
                      </label>
                      <input
                        type="date"
                        id="upload-date"
                        value={uploadDateFilter}
                        onChange={handleUploadDateChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <StorageSavingsCard />

            <div className="bg-white shadow sm:rounded-lg">
              <FileList
                key={refreshKey}
                searchQuery={searchQuery}
                fileTypeFilter={fileTypeFilter}
                sizeRangeFilter={sizeRangeFilter}
                uploadDateFilter={uploadDateFilter}
              />
            </div>
          </div>
        </div>
      </main>
      <footer className="bg-white shadow mt-8">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
          <p className="text-center text-sm text-gray-500">
            © 2024 File Hub. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;
