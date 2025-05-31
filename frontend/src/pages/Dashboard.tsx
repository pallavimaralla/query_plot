import React, { useState } from 'react';
import FileUpload from '../components/FileUpload';
import QueryInput from '../components/QueryInput';
import ChartDisplay from '../components/ChartDisplay';
import DownloadSection from '../components/DownloadSection';
import { FileDetails, QueryParams } from '../types';
import { DatabaseIcon } from 'lucide-react';

const Dashboard: React.FC = () => {
  const [file, setFile] = useState<FileDetails | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [downloadUrl, setDownloadUrl] = useState<string | undefined>(undefined);

  const handleFileUploaded = (fileDetails: FileDetails | null) => {
    setFile(fileDetails);
    setDownloadUrl(undefined);
  };

  const handleSubmitQuery = async (params: QueryParams) => {
    if (!file) return;

    setIsProcessing(true);
    setDownloadUrl(undefined);

    try {
      // Step 1: Send query to /query endpoint
      const queryRes = await fetch(`${import.meta.env.VITE_API_BASE_URL}/query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: params.query,
          preview: '...', // Optional preview text
          filename: file.name
        })
      });

      const { code } = await queryRes.json();
      console.log('✅ LLM generated code:', code);

      // Step 2: Send code + filename to /process endpoint
      const runRes = await fetch(`${import.meta.env.VITE_API_BASE_URL}/process`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename: file.name, code })
      });

      const { key } = await runRes.json();
      const downloadLink = `${import.meta.env.VITE_API_BASE_URL}/download/${key}`;
      setDownloadUrl(downloadLink);
    } catch (error) {
      console.error('❌ Error processing query:', error);
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
                  isProcessing={isProcessing}
                  uploadedFilename={file?.name || ''}
              />
            </div>

            <div className="space-y-6">
              <ChartDisplay chartData={null} isProcessing={isProcessing} />
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
