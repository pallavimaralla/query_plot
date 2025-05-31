import React, { useState } from 'react';
import { SearchIcon } from 'lucide-react';
import { QueryParams } from '../types';
// import { useEffect } from 'react';


interface QueryInputProps {
  onSubmitQuery: (params: QueryParams) => void;
  fileUploaded: boolean;
  isProcessing: boolean;
  uploadedFilename: string
}

const QueryInput: React.FC<QueryInputProps> = ({ onSubmitQuery, fileUploaded, isProcessing }) => {
  const [query, setQuery] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const validateQuery = (): boolean => {
    if (query.trim().length === 0) {
      setError('Please enter a query');
      return false;
    }
    
    if (!fileUploaded) {
      setError('Please upload a CSV file first');
      return false;
    }
    
    setError(null);
    return true;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateQuery()) {
      onSubmitQuery({ query });
    }
  };

  const handleExampleClick = (exampleQuery: string) => {
    setQuery(exampleQuery);
  };

  return (
    <div className="bg-[#1F2937] rounded-lg shadow-md p-6 mb-6">
      <h2 className="text-xl font-semibold text-gray-200 mb-4">Query Your Data</h2>
      
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label htmlFor="query" className="block text-sm font-medium text-gray-200 mb-4">
            Natural Language Query
          </label>
          <textarea
            id="query"
            className="w-full border bg-[#1F2937] text-white rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
            rows={3}
            placeholder="e.g., Show a pie chart of revenue by product"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />


          <div className="mt-2 text-xs text-gray-500">
            <p className="mb-1">Example queries (click to use):</p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => handleExampleClick("Show a pie chart of revenue by product")}
                className="text-red-600 hover:text-red-800 hover:underline"
              >
                Pie chart of revenue
              </button>
              <button
                type="button"
                onClick={() => handleExampleClick("Create a bar chart of monthly sales")}
                className="text-red-600 hover:text-red-800 hover:underline"
              >
                Bar chart of sales
              </button>
              <button
                type="button"
                onClick={() => handleExampleClick("Generate a histogram of customer age distribution")}
                className="text-red-600 hover:text-red-800 hover:underline"
              >
                Histogram of ages
              </button>
            </div>
          </div>
        </div>
        
        {error && (
          <div className="mb-4 text-red-500 text-sm">
            {error}
          </div>
        )}
        
        <button
          type="submit"
          disabled={isProcessing}
          className={`w-full flex items-center justify-center font-medium py-2 px-4 rounded-md transition-colors duration-200 ${
            isProcessing
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-red-600 hover:bg-red-700 text-white'
          }`}
        >
          {isProcessing ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white\" xmlns="http://www.w3.org/2000/svg\" fill="none\" viewBox="0 0 24 24">
                <circle className="opacity-25\" cx="12\" cy="12\" r="10\" stroke="currentColor\" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Processing...
            </>
          ) : (
            <>
              <SearchIcon className="w-4 h-4 mr-2" />
              Run Query
            </>
          )}
        </button>
      </form>
    </div>
  );
};

export default QueryInput;