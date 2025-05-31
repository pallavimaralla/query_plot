import React, { useState, useRef, DragEvent, ChangeEvent } from 'react';
import { FileIcon, UploadIcon, XIcon } from 'lucide-react';
import { FileDetails } from '../types';

interface FileUploadProps {
  onFileUploaded: (file: FileDetails | null, backendFilename?: string) => void;
}

const FileUpload: React.FC<FileUploadProps> = ({ onFileUploaded }) => {
  const [file, setFile] = useState<FileDetails | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const validateFile = (file: File): boolean => {
    if (!file.name.endsWith('.csv')) {
      setError('Please upload a CSV file');
      return false;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError('File size exceeds 10MB limit');
      return false;
    }

    return true;
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' bytes';
    else if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    else return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const processFile = async (file: File) => {
    if (!validateFile(file)) {
      onFileUploaded(null);
      return;
    }

    const fileDetails: FileDetails = {
      name: file.name,
      size: file.size,
      type: file.type,
    };

    setFile(fileDetails);
    setError(null);

    // ✅ Send to backend
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/upload`, {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      console.log('Uploaded filename:', data.filename);
      onFileUploaded(fileDetails, data.filename); // ✅ Pass both frontend + backend filename
    } catch (err) {
      console.error(err);
      setError('Failed to upload file to backend');
      onFileUploaded(null);
    }
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFile(e.target.files[0]);
    }
  };

  const handleClickUpload = () => {
    fileInputRef.current?.click();
  };

  const handleRemoveFile = () => {
    setFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    onFileUploaded(null);
  };

  return (
      <div className="bg-[#1F2937] rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-200 mb-4">Upload CSV Data</h2>

        {!file ? (
            <div
                className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors duration-200 ${
                    isDragging
                        ? 'border-red-500 bg-red-500/10'
                        : 'border-gray-600 hover:border-red-400 hover:bg-gray-800/50'
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={handleClickUpload}
            >
              <div className="flex flex-col items-center justify-center">
                <UploadIcon className="w-12 h-12 text-red-500 mb-3" />
                <p className="text-gray-300 mb-2">Drag and drop your CSV file here</p>
                <p className="text-sm text-gray-400 mb-4">or click to browse</p>
                <button
                    type="button"
                    className="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-md transition-colors duration-200"
                >
                  Select File
                </button>
              </div>
              <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  className="hidden"
                  onChange={handleFileChange}
              />
            </div>
        ) : (
            <div className="border border-gray-700 rounded-lg p-4 bg-gray-800/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="bg-red-500/20 p-3 rounded-md mr-3">
                    <FileIcon className="w-6 h-6 text-red-500" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-200">{file.name}</p>
                    <p className="text-sm text-gray-400">{formatFileSize(file.size)}</p>
                  </div>
                </div>
                <button
                    onClick={handleRemoveFile}
                    className="text-gray-400 hover:text-red-500 transition-colors"
                >
                  <XIcon className="w-5 h-5" />
                </button>
              </div>
            </div>
        )}

        {error && (
            <div className="mt-3 text-red-500 text-sm">
              {error}
            </div>
        )}
      </div>
  );
};

export default FileUpload;
