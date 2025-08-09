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

export interface StreamEvent {
  type: 'started' | 'file_started' | 'file_completed' | 'file_error' | 'completed' | 'error';
  audit_id?: string;
  total_files?: number;
  total_parameters?: number;
  expected_time?: string;
  file_index?: number;
  filename?: string;
  overall_score?: number;
  results?: number; // For backward compatibility
  results_count?: number; // New field for result count
  progress?: number;
  error?: string;
  message?: string;
  processing_time?: number;
  processed_files?: number;
  overall_summary?: string;
  file_size?: number;
  detailed_results?: AuditResult[]; // New field for detailed parameter results
}

export interface JobStartResponse {
  job_id: string;
  status: string;
  message: string;
  total_files: number;
  estimated_time: string;
}

export interface JobStatus {
  status: 'processing' | 'completed' | 'failed';
  progress: number;
  total_files: number;
  processed_files: number;
  current_file?: string;
  results?: AuditResponse;
  error?: string;
  started_at: number;
  completed_at?: number;
  processing_time?: number;
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

  // Perform audit (optimized)
  async performAudit(files: File[], request: AuditRequest, useOptimized: boolean = true): Promise<AuditResponse> {
    const formData = new FormData();
    
    // Add files
    files.forEach((file) => {
      formData.append('files', file);
    });

    // Add request JSON
    formData.append('request', JSON.stringify(request));

    // Use optimized endpoint by default for better performance
    const endpoint = useOptimized ? '/audit/optimized' : '/audit';
    
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Audit failed: ${errorData.detail || response.statusText}`);
    }

    return response.json();
  }

  // Legacy method for compatibility
  async performAuditLegacy(files: File[], request: AuditRequest): Promise<AuditResponse> {
    return this.performAudit(files, request, false);
  }

  // Streaming audit with real-time progress
  async performAuditStream(
    files: File[], 
    request: AuditRequest, 
    onProgress: (event: StreamEvent) => void
  ): Promise<AuditResponse> {
    const formData = new FormData();
    
    // Add files
    files.forEach((file) => {
      formData.append('files', file);
    });

    // Add request JSON
    formData.append('request', JSON.stringify(request));

    const response = await fetch(`${this.baseUrl}/audit/stream`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Streaming audit failed: ${errorData.detail || response.statusText}`);
    }

    return new Promise<AuditResponse>((resolve, reject) => {
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      function readStream() {
        reader?.read().then(({ done, value }) => {
          if (done) {
            return;
          }

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || ''; // Keep incomplete line in buffer

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6));
                onProgress(data);

                if (data.type === 'completed') {
                  // Convert the streaming response to AuditResponse format
                  const auditResponse: AuditResponse = {
                    audit_id: data.audit_id,
                    total_files: data.total_files,
                    processed_files: data.processed_files,
                    results: [], // Results are sent via progress events
                    overall_summary: data.overall_summary,
                    generated_at: new Date().toISOString(),
                    processing_time: data.processing_time
                  };
                  resolve(auditResponse);
                } else if (data.type === 'error') {
                  reject(new Error(data.message));
                }
              } catch (e) {
                console.error('Error parsing SSE data:', e);
              }
            }
          }

          readStream(); // Continue reading
        }).catch(reject);
      }

      readStream();
    });
  }

  // Background audit job methods
  async startAuditJob(files: File[], request: AuditRequest): Promise<JobStartResponse> {
    const formData = new FormData();
    
    // Add files
    files.forEach((file) => {
      formData.append('files', file);
    });

    // Add request JSON
    formData.append('request', JSON.stringify(request));

    const response = await fetch(`${this.baseUrl}/audit/async`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Failed to start audit job: ${errorData.detail || response.statusText}`);
    }

    return response.json();
  }

  async getJobStatus(jobId: string): Promise<JobStatus> {
    const response = await fetch(`${this.baseUrl}/audit/status/${jobId}`);
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Failed to get job status: ${errorData.detail || response.statusText}`);
    }

    return response.json();
  }

  async getJobResult(jobId: string): Promise<AuditResponse> {
    const response = await fetch(`${this.baseUrl}/audit/result/${jobId}`);
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Failed to get job result: ${errorData.detail || response.statusText}`);
    }

    return response.json();
  }
}

export const apiService = new ApiService();
export default apiService; 