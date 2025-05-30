import { AnalysisResult, ChartType, QueryParams } from "../types";

export const determineChartType = (query: string): ChartType => {
  const queryLower = query.toLowerCase();
  
  if (queryLower.includes('pie') || queryLower.includes('distribution')) {
    return 'pie';
  } else if (queryLower.includes('histogram') || queryLower.includes('frequency')) {
    return 'histogram';
  } else {
    return 'bar';
  }
};

export const processQuery = (params: QueryParams): Promise<AnalysisResult> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const chartType = determineChartType(params.query);
      const mockData = generateMockData(chartType);
      
      resolve({
        chartData: {
          type: chartType,
          title: `Analysis Results`,
          data: mockData
        },
        isProcessing: false
      });
    }, 2000);
  });
};

const generateMockData = (chartType: ChartType) => {
  switch (chartType) {
    case 'pie':
      return [
        { label: 'Product A', value: 35 },
        { label: 'Product B', value: 25 },
        { label: 'Product C', value: 20 },
        { label: 'Product D', value: 15 },
        { label: 'Others', value: 5 }
      ];
    case 'bar':
      return {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May'],
        datasets: [
          {
            values: [18, 25, 30, 22, 28]
          }
        ]
      };
    case 'histogram':
      return {
        labels: ['0-10', '11-20', '21-30', '31-40', '41-50', '51+'],
        frequencies: [5, 12, 18, 15, 8, 3]
      };
    default:
      return [];
  }
};

export const generateDownloadUrl = (): Promise<string> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve('data:text/plain;charset=utf-8,mock_analysis_results.csv');
    }, 3000);
  });
};