import React, { useState } from 'react';
import FileUpload from '../components/FileUpload';
import QueryInput from '../components/QueryInput';
import ChartDisplay from '../components/ChartDisplay';
import DownloadSection from '../components/DownloadSection';
import { FileDetails, QueryParams } from '../types';
import { DatabaseIcon } from 'lucide-react';

const Dashboard: React.FC = () => {
  const [file, setFile] = useState<FileDetails | null>(null);
  const [backendFileName, setBackendFileName] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [downloadUrl, setDownloadUrl] = useState<string | undefined>(undefined);
  const [chartData, setChartData] = useState<any>(null);
  const [chartUrl, setChartUrl] = useState<string | null>(null);

  const handleFileUploaded = (fileDetails: FileDetails | null, uploadedBackendFilename?: string) => {
    setFile(fileDetails);
    setBackendFileName(uploadedBackendFilename || null);
    setDownloadUrl(undefined);
    setChartData(null);
    setChartUrl(null);
  };

  const handleSubmitQuery = async (params: QueryParams) => {
    const currentFileName = backendFileName || file?.name;
    if (!currentFileName) {
      console.error('No file selected or uploaded backend filename is missing.');
      return;
    }

    setIsProcessing(true);
    setDownloadUrl(undefined);
    setChartData(null);
    setChartUrl(null);

    try {
      // Step 1: Send query to /query endpoint
      const queryRes = await fetch(`${import.meta.env.VITE_API_BASE_URL}/query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: params.query,
          preview: '...',
          filename: currentFileName
        })
      });

      const { code } = await queryRes.json();

      // Step 2: Send code + filename to /process endpoint
      const runRes = await fetch(`${import.meta.env.VITE_API_BASE_URL}/process`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename: currentFileName, code })
      });

      // Expecting backend to return { key, chartData, chartUrl }
      const { key, chartData: backendChartData, chartUrl: backendChartUrl } = await runRes.json();

      // Prefer backendChartUrl if provided, otherwise construct from key
      const constructedChartUrl = backendChartUrl
          ? backendChartUrl
          : key
              ? `${import.meta.env.VITE_API_BASE_URL}/download/${key}`
              : null;

      setDownloadUrl(key ? `${import.meta.env.VITE_API_BASE_URL}/download/${key}` : undefined);
      setChartData(backendChartData || null);
      setChartUrl(constructedChartUrl);
    } catch (error) {
      console.error('❌ Error processing query:', error);
      setChartData(null);
      setChartUrl(null);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
      <div className="min-h-screen bg-[#111827]">
        <header className="bg-[#1F2937] shadow-lg border-b border-gray-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center">
              <DatabaseIcon className="h-8 w-8 text-red-500 mr-3" />
              <h1 className="text-2xl font-bold text-white">Query Plot</h1>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-6">
              <FileUpload onFileUploaded={handleFileUploaded} />
              <QueryInput
                  onSubmitQuery={handleSubmitQuery}
                  fileUploaded={!!file}
                  uploadedFilename={file?.name || ''}
                  isProcessing={isProcessing}
              />
            </div>

            <div className="space-y-6">
              <ChartDisplay
                  chartData={chartData}
                  isProcessing={isProcessing}
                  chartUrl={chartUrl}
              />
              <DownloadSection downloadUrl={downloadUrl} isProcessing={isProcessing} />
            </div>
          </div>
        </main>

        <footer className="bg-[#1F2937] border-t border-gray-800 mt-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <p className="text-center text-sm text-gray-400">
              Data Analysis Platform &copy; {new Date().getFullYear()}
            </p>
          </div>
        </footer>
      </div>
  );
};

export default Dashboard;