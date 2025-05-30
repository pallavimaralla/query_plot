import React from 'react';
import { ChartType, ChartData } from '../types';
import { PieChartIcon, BarChartIcon, LineChartIcon } from 'lucide-react';

interface ChartDisplayProps {
  chartData: ChartData | null;
  isProcessing: boolean;
}

const ChartDisplay: React.FC<ChartDisplayProps> = ({ chartData, isProcessing }) => {
  if (isProcessing) {
    return (
      <div className="bg-[#1F2937] rounded-lg shadow-md p-6 h-full flex items-center justify-center">
        <div className="text-center">
          <div className="mb-4">
            <svg className="animate-spin h-10 w-10 text-red-500 mx-auto\" xmlns="http://www.w3.org/2000/svg\" fill="none\" viewBox="0 0 24 24">
              <circle className="opacity-25\" cx="12\" cy="12\" r="10\" stroke="currentColor\" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
          <p className="text-gray-300 font-medium">Processing your query...</p>
          <p className="text-sm text-gray-400 mt-2">This may take a few moments</p>
        </div>
      </div>
    );
  }

  if (!chartData) {
    return (
      <div className="bg-[#1F2937] rounded-lg shadow-md p-6 h-full flex items-center justify-center">
        <div className="text-center">
          <div className="mb-4 flex justify-center">
            <div className="flex items-center space-x-2">
              <PieChartIcon className="w-8 h-8 text-red-500" />
              <BarChartIcon className="w-8 h-8 text-red-400" />
              <LineChartIcon className="w-8 h-8 text-red-300" />
            </div>
          </div>
          <h3 className="text-gray-300 font-medium text-lg mb-2">No chart data available</h3>
          <p className="text-sm text-gray-400">Upload a CSV file and run a query to visualize your data</p>
        </div>
      </div>
    );
  }

  const renderChart = () => {
    switch (chartData.type) {
      case 'pie':
        return <PieChartPlaceholder data={chartData.data} />;
      case 'bar':
        return <BarChartPlaceholder data={chartData.data} />;
      case 'histogram':
        return <HistogramPlaceholder data={chartData.data} />;
      default:
        return <div>Unsupported chart type</div>;
    }
  };

  return (
    <div className="bg-[#1F2937] rounded-lg shadow-md p-6 h-full">
      <h2 className="text-xl font-semibold text-gray-200 mb-4">{chartData.title}</h2>
      <div className="h-[300px] flex items-center justify-center">
        {renderChart()}
      </div>
    </div>
  );
};

const PieChartPlaceholder: React.FC<{ data: any }> = ({ data }) => {
  const colors = ['#DC2626', '#F87171', '#991B1B', '#7F1D1D', '#B91C1C'];
  const total = data.reduce((sum: number, item: any) => sum + item.value, 0);
  
  return (
    <div className="w-full h-full flex flex-col items-center justify-center">
      <div className="relative w-48 h-48">
        {data.map((item: any, index: number) => {
          const color = colors[index % colors.length];
          return (
            <div 
              key={index}
              className="absolute top-0 left-0 w-full h-full"
              style={{
                background: `conic-gradient(transparent ${index * (360 / data.length)}deg, ${color} ${index * (360 / data.length)}deg, ${color} ${(index + 1) * (360 / data.length)}deg, transparent ${(index + 1) * (360 / data.length)}deg)`,
                borderRadius: '50%'
              }}
            />
          );
        })}
      </div>
      <div className="mt-6 grid grid-cols-2 gap-x-8 gap-y-2">
        {data.map((item: any, index: number) => (
          <div key={index} className="flex items-center">
            <div 
              className="w-3 h-3 mr-2" 
              style={{ backgroundColor: colors[index % colors.length] }}
            />
            <span className="text-sm text-gray-300">
              {item.label}: {Math.round((item.value / total) * 100)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

const BarChartPlaceholder: React.FC<{ data: any }> = ({ data }) => {
  const maxValue = Math.max(...data.datasets[0].values);
  
  return (
    <div className="w-full h-full flex flex-col">
      <div className="flex-1 flex items-end justify-between gap-2">
        {data.labels.map((label: string, index: number) => {
          const value = data.datasets[0].values[index];
          const height = `${(value / maxValue) * 100}%`;
          
          return (
            <div key={index} className="flex flex-col items-center flex-1">
              <div className="w-full bg-red-600 rounded-t-sm" style={{ height }}></div>
              <span className="text-xs mt-1 text-gray-400">{label}</span>
            </div>
          );
        })}
      </div>
      <div className="mt-6 text-center text-sm text-gray-400">
        Bar Chart: {data.labels[0]} to {data.labels[data.labels.length - 1]}
      </div>
    </div>
  );
};

const HistogramPlaceholder: React.FC<{ data: any }> = ({ data }) => {
  const maxFrequency = Math.max(...data.frequencies);
  
  return (
    <div className="w-full h-full flex flex-col">
      <div className="flex-1 flex items-end justify-between gap-2">
        {data.labels.map((label: string, index: number) => {
          const frequency = data.frequencies[index];
          const height = `${(frequency / maxFrequency) * 100}%`;
          
          return (
            <div key={index} className="flex flex-col items-center flex-1">
              <div className="w-full bg-red-500 rounded-t-sm" style={{ height }}></div>
              <span className="text-xs mt-1 text-gray-400">{label}</span>
            </div>
          );
        })}
      </div>
      <div className="mt-6 text-center text-sm text-gray-400">
        Histogram: Frequency Distribution
      </div>
    </div>
  );
};

export default ChartDisplay;