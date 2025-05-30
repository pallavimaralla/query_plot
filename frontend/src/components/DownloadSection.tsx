import React, { useState } from 'react';
import { DownloadIcon, CheckIcon } from 'lucide-react';

interface DownloadSectionProps {
  downloadUrl: string | undefined;
  isProcessing: boolean;
}

const DownloadSection: React.FC<DownloadSectionProps> = ({ downloadUrl, isProcessing }) => {
  const [isDownloaded, setIsDownloaded] = useState(false);

  const handleDownload = () => {
    if (downloadUrl) {
      setIsDownloaded(true);
      
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = 'analysis_results.csv';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
      setTimeout(() => {
        setIsDownloaded(false);
      }, 3000);
    }
  };

  if (isProcessing) {
    return (
      <div className="bg-[#1F2937] rounded-lg shadow-md p-6">
        <button
          disabled
          className="w-full bg-gray-600 text-gray-300 py-3 px-4 rounded-md flex items-center justify-center cursor-not-allowed"
        >
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-gray-300\" xmlns="http://www.w3.org/2000/svg\" fill="none\" viewBox="0 0 24 24">
            <circle className="opacity-25\" cx="12\" cy="12\" r="10\" stroke="currentColor\" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Processing...
        </button>
      </div>
    );
  }

  if (!downloadUrl) {
    return (
      <div className="bg-[#1F2937] rounded-lg shadow-md p-6">
        <button
          disabled
          className="w-full bg-gray-600 text-gray-300 py-3 px-4 rounded-md flex items-center justify-center cursor-not-allowed"
        >
          <DownloadIcon className="w-4 h-4 mr-2" />
          Download Results
        </button>
      </div>
    );
  }

  return (
    <div className="bg-[#1F2937] rounded-lg shadow-md p-6">
      <button
        onClick={handleDownload}
        className={`w-full py-3 px-4 rounded-md flex items-center justify-center transition-colors duration-200 ${
          isDownloaded
            ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
            : 'bg-red-600 hover:bg-red-700 text-white'
        }`}
      >
        {isDownloaded ? (
          <>
            <CheckIcon className="w-4 h-4 mr-2" />
            Downloaded
          </>
        ) : (
          <>
            <DownloadIcon className="w-4 h-4 mr-2" />
            Download Results
          </>
        )}
      </button>
    </div>
  );
};

export default DownloadSection;