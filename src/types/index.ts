export interface FileDetails {
  name: string;
  size: number;
  type?: string;
}

export interface QueryParams {
  query: string;
  file?: FileDetails;
}

export type ChartType = 'pie' | 'bar' | 'histogram';

export interface ChartData {
  type: ChartType;
  title: string;
  data: any; // Would be properly typed in a real implementation
}

export interface AnalysisResult {
  chartData: ChartData;
  downloadUrl?: string;
  isProcessing: boolean;
}