const API_BASE_URL = 'http://localhost:8000/api/v1';

export interface AuditParameter {
  id: string;
  name: string;
  description: string;
  category: string;
}

export interface AuditResult {
  parameter: string;
  verdict: string;
  confidence: string;
  reasoning?: string;
  timestamp: string;
}

export interface FileAuditResult {
  filename: string;
  file_size: number;
  duration?: number;
  results: AuditResult[];
  overall_score?: number;
  summary?: string;
}

export interface AuditRequest {
  parameters: string[];
  custom_prompts?: Record<string, string>;
}

export interface AuditResponse {
  audit_id: string;
  total_files: number;
  processed_files: number;
  results: FileAuditResult[];
  overall_summary?: string;
  generated_at: string;
  processing_time?: number;
}

export interface UploadResponse {
  message: string;
  uploaded_files: string[];
  total_size: number;
  file_count: number;
}

class ApiService {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  // Health check
  async checkHealth(): Promise<{ status: string; timestamp: string; version: string }> {
    const response = await fetch(`${this.baseUrl}/health`);
    if (!response.ok) {
      throw new Error(`Health check failed: ${response.statusText}`);
    }
    return response.json();
  }

  // Get available audit parameters
  async getParameters(): Promise<{ parameters: AuditParameter[] }> {
    const response = await fetch(`${this.baseUrl}/parameters`);
    if (!response.ok) {
      throw new Error(`Failed to get parameters: ${response.statusText}`);
    }
    return response.json();
  }

  // Upload files
  async uploadFiles(files: File[]): Promise<UploadResponse> {
    const formData = new FormData();
    
    files.forEach((file) => {
      formData.append('files', file);
    });

    const response = await fetch(`${this.baseUrl}/upload`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Upload failed: ${errorData.detail || response.statusText}`);
    }

    return response.json();
  }

  // Perform audit
  async performAudit(files: File[], request: AuditRequest): Promise<AuditResponse> {
    const formData = new FormData();
    
    // Add files
    files.forEach((file) => {
      formData.append('files', file);
    });

    // Add request JSON
    formData.append('request', JSON.stringify(request));

    const response = await fetch(`${this.baseUrl}/audit`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Audit failed: ${errorData.detail || response.statusText}`);
    }

    return response.json();
  }
}

export const apiService = new ApiService();
export default apiService; 