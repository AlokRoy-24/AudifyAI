import { useState, useEffect, forwardRef, useImperativeHandle } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Loader2, AlertCircle, Clock, FileAudio } from "lucide-react";
import { StreamEvent, AuditResult } from "@/services/api";

interface AuditProgressProps {
  isVisible: boolean;
  onComplete: (results: any) => void;
  onError: (error: string) => void;
  onFileCompleted?: (fileResult: any) => void;
  onFileError?: (fileError: any) => void;
}

interface FileProgress {
  index: number;
  filename: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  score?: number;
  error?: string;
  resultsCount?: number;
  fileSize?: number;
  detailedResults?: AuditResult[];
  completedAt?: Date;
}

const AuditProgress = forwardRef<{ handleStreamEvent: (event: StreamEvent) => void }, AuditProgressProps>(
  ({ isVisible, onComplete, onError, onFileCompleted, onFileError }, ref) => {
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<'started' | 'processing' | 'completed' | 'error'>('started');
  const [currentPhase, setCurrentPhase] = useState('Initializing...');
  const [totalFiles, setTotalFiles] = useState(0);
  const [processedFiles, setProcessedFiles] = useState(0);
  const [files, setFiles] = useState<FileProgress[]>([]);
  const [auditId, setAuditId] = useState<string>('');
  const [processingTime, setProcessingTime] = useState(0);

  // Timer for processing time
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (status === 'processing' || status === 'started') {
      interval = setInterval(() => {
        setProcessingTime(prev => prev + 0.1);
      }, 100);
    }
    return () => clearInterval(interval);
  }, [status]);

  // Expose handleStreamEvent method to parent component
  useImperativeHandle(ref, () => ({
    handleStreamEvent
  }));

  const handleStreamEvent = (event: StreamEvent) => {
    switch (event.type) {
      case 'started':
        setStatus('processing');
        setAuditId(event.audit_id || '');
        setTotalFiles(event.total_files || 0);
        setCurrentPhase(`Starting audit for ${event.total_files} files with ${event.total_parameters} parameters`);
        setProgress(5);
        
        // Initialize file tracking
        const initialFiles: FileProgress[] = [];
        for (let i = 0; i < (event.total_files || 0); i++) {
          initialFiles.push({
            index: i,
            filename: `File ${i + 1}`,
            status: 'pending'
          });
        }
        setFiles(initialFiles);
        break;

      case 'file_started':
        setCurrentPhase(`Processing ${event.filename}...`);
        
        setFiles(prev => prev.map(file => 
          file.index === event.file_index 
            ? { ...file, filename: event.filename || file.filename, status: 'processing' }
            : file
        ));
        
        // Update progress based on files started
        const startedFiles = files.filter(f => f.status === 'processing' || f.status === 'completed').length;
        const newProgress = Math.min(5 + (startedFiles / totalFiles) * 85, 90);
        setProgress(newProgress);
        break;

      case 'file_completed':
        const completedFile = {
          index: event.file_index || 0,
          filename: event.filename || '',
          status: 'completed' as const,
          score: event.overall_score,
          resultsCount: event.results_count || event.results,
          fileSize: event.file_size,
          detailedResults: event.detailed_results || [],
          completedAt: new Date()
        };

        setFiles(prev => prev.map(file => 
          file.index === event.file_index 
            ? completedFile
            : file
        ));

        // Add to completed results immediately
        const fileResult = {
          filename: event.filename || '',
          file_size: event.file_size || 0,
          results: event.detailed_results || [],
          overall_score: event.overall_score || 0,
          summary: `File processed with score: ${event.overall_score?.toFixed(1)}%`
        };
        
        // Notify parent component about file completion
        if (onFileCompleted) {
          onFileCompleted(fileResult);
        }
        
        // Update progress
        setProcessedFiles(prev => prev + 1);
        const completedProgress = Math.min(5 + (processedFiles + 1) / totalFiles * 85, 90);
        setProgress(completedProgress);
        
        setCurrentPhase(`Completed ${event.filename} (Score: ${event.overall_score?.toFixed(1)}%)`);
        break;

      case 'file_error':
        setCurrentPhase(`Error processing ${event.filename}: ${event.error}`);
        
        setFiles(prev => prev.map(file => 
          file.index === event.file_index 
            ? { 
                ...file, 
                filename: event.filename || file.filename, 
                status: 'error',
                error: event.error 
              }
            : file
        ));
        
        setProcessedFiles(prev => prev + 1);
        
        // Notify parent component about file error
        if (onFileError) {
          onFileError({
            filename: event.filename || '',
            error: event.error || 'Unknown error'
          });
        }
        break;

      case 'completed':
        setStatus('completed');
        setProgress(100);
        setCurrentPhase(`Audit completed! Processed ${event.processed_files} files in ${event.processing_time?.toFixed(1)}s`);
        setProcessingTime(event.processing_time || 0);
        
        // Trigger completion callback with collected file results
        setTimeout(() => {
          onComplete({
            audit_id: event.audit_id,
            total_files: event.total_files,
            processed_files: event.processed_files,
            processing_time: event.processing_time,
            overall_summary: event.overall_summary,
            fileResults: [] // No longer collecting file results here
          });
        }, 1000);
        break;

      case 'error':
        setStatus('error');
        setCurrentPhase(`Error: ${event.message}`);
        onError(event.message || 'Unknown error occurred');
        break;
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'started':
      case 'processing':
        return <Loader2 className="w-5 h-5 animate-spin text-blue-500" />;
      case 'completed':
        return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
    }
  };

  const getFileStatusIcon = (fileStatus: FileProgress['status']) => {
    switch (fileStatus) {
      case 'pending':
        return <Clock className="w-4 h-4 text-gray-400" />;
      case 'processing':
        return <Loader2 className="w-4 h-4 animate-spin text-blue-500" />;
      case 'completed':
        return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
    }
  };

  if (!isVisible) return null;

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {getStatusIcon()}
          Audit Progress
          <Badge variant="outline" className="ml-auto">
            {auditId.slice(0, 8)}
          </Badge>
        </CardTitle>
        <CardDescription>
          {currentPhase}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Main Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Overall Progress</span>
            <span>{Math.max(0, Math.min(100, progress || 0)).toFixed(0)}%</span>
          </div>
          <Progress value={progress} className="w-full" />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Processed: {processedFiles}/{totalFiles} files</span>
            <span>Time: {processingTime.toFixed(1)}s</span>
          </div>
        </div>

        {/* File Progress List */}
        {files.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">File Processing Status</h4>
            <div className="grid gap-2 max-h-40 overflow-y-auto">
              {files.map((file) => (
                <div 
                  key={file.index} 
                  className="flex items-center gap-3 p-2 border rounded text-sm"
                >
                  {getFileStatusIcon(file.status)}
                  <FileAudio className="w-4 h-4 text-muted-foreground" />
                  <span className="flex-1 truncate">{file.filename}</span>
                  
                  {file.status === 'completed' && file.score !== undefined && (
                    <Badge variant="secondary">
                      {file.score.toFixed(1)}%
                    </Badge>
                  )}
                  
                  {file.status === 'error' && (
                    <Badge variant="destructive">
                      Error
                    </Badge>
                  )}
                  
                  {file.status === 'processing' && (
                    <Badge variant="outline">
                      Processing...
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{totalFiles}</div>
            <div className="text-xs text-muted-foreground">Total Files</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{processedFiles}</div>
            <div className="text-xs text-muted-foreground">Processed</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">{processingTime.toFixed(1)}s</div>
            <div className="text-xs text-muted-foreground">Processing Time</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">{Math.max(0, Math.min(100, progress || 0)).toFixed(0)}%</div>
            <div className="text-xs text-muted-foreground">Complete</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

// Add display name for debugging
AuditProgress.displayName = 'AuditProgress';

export default AuditProgress;
