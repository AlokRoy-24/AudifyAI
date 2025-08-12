import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import AuditParametersDrawer from "./AuditParametersDrawer";
import { CheckCircle2, Upload, Loader2, AlertCircle, XCircle } from "lucide-react";
import apiService, { StreamEvent } from "@/services/api";
import { useToast } from "@/hooks/use-toast";
import AuditProgress from "./AuditProgress";
import { Badge } from "@/components/ui/badge";

const ProcessSteps = () => {
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [selectedParameters, setSelectedParameters] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showProgress, setShowProgress] = useState(false);
  const [streamingError, setStreamingError] = useState<string | null>(null);
  const [fileWiseResults, setFileWiseResults] = useState<any[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const auditProgressRef = useRef<{ handleStreamEvent: (event: StreamEvent) => void }>(null);
  const { toast } = useToast();

  // Reset progress state when starting new audit
  const resetProgressState = () => {
    setShowProgress(false);
    setStreamingError(null);
    setFileWiseResults([]);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length > 10) {
      toast({
        title: "Too Many Files",
        description: "Maximum 10 files allowed",
        variant: "destructive",
      });
      return;
    }
    setUploadedFiles(files);
    if (files.length > 0 && !completedSteps.includes(1)) {
      setCompletedSteps(prev => [...prev, 1]);
    }
    // Reset progress state when new files are uploaded
    resetProgressState();
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleParametersComplete = () => {
    if (!completedSteps.includes(2)) {
      setCompletedSteps(prev => [...prev, 2]);
    }
    // Reset progress state when parameters change
    resetProgressState();
  };

  const handleGenerateReport = async () => {
    if (completedSteps.includes(1) && completedSteps.includes(2)) {
      if (!completedSteps.includes(3)) {
        setCompletedSteps(prev => [...prev, 3]);
      }
      
      setIsProcessing(true);
      setShowProgress(true);
      
      try {
        // Use streaming for real-time progress
        console.log(`Starting streaming audit for ${uploadedFiles.length} files with ${selectedParameters.length} parameters`);
        
        const results = await apiService.performAuditStream(
          uploadedFiles, 
          {
            parameters: selectedParameters,
            custom_prompts: {}
          },
          handleStreamEvent
        );
        
        // Results will be set via progress completion
        console.log('Streaming audit completed:', results);
        
      } catch (error) {
        console.error('Audit failed:', error);
        setShowProgress(false);
        setIsProcessing(false);
        
        let errorMessage = "An error occurred during the audit.";
        if (error instanceof Error) {
          errorMessage = error.message;
        } else if (typeof error === 'string') {
          errorMessage = error;
        }
        
        toast({
          title: "Audit Failed",
          description: errorMessage,
          variant: "destructive",
        });
        
        // Remove step 3 if it was added
        setCompletedSteps(prev => prev.filter(step => step !== 3));
      }
    } else {
      toast({
        title: "Incomplete Steps",
        description: "Please complete steps 1 and 2 first",
        variant: "destructive",
      });
    }
  };

  const handleStreamEvent = (event: StreamEvent) => {
    // Stream events are handled by the AuditProgress component
    console.log('Stream event received:', event);
    
    // Pass the event to the AuditProgress component if it's visible
    if (auditProgressRef.current) {
      auditProgressRef.current.handleStreamEvent(event);
    } else {
      console.warn('AuditProgress ref not available for stream event:', event);
    }
  };

  const handleProgressComplete = (results: any) => {
    console.log('Progress completed with results:', results);
    setIsProcessing(false);
    setShowProgress(false);
    
    // Pass the file-wise results to the completion callback
    const finalResults = {
      ...results,
      fileResults: fileWiseResults
    };
    
    toast({
      title: "Audit Complete!",
      description: `Successfully processed ${finalResults.processed_files} files in ${finalResults.processing_time?.toFixed(1)}s with real-time updates.`,
    });
  };

  const handleProgressError = (error: string) => {
    console.error('Progress error:', error);
    setIsProcessing(false);
    setShowProgress(false);
    
    toast({
      title: "Audit Failed",
      description: error,
      variant: "destructive",
    });
    
    // Remove step 3 if it was added
    setCompletedSteps(prev => prev.filter(step => step !== 3));
  };

  const handleFileCompleted = (fileResult: any) => {
    console.log('File completed:', fileResult);
    // Add the completed file result to the file-wise results
    setFileWiseResults(prev => {
      // Check if file already exists (in case of duplicates)
      const existingIndex = prev.findIndex(result => result.filename === fileResult.filename);
      if (existingIndex >= 0) {
        // Update existing result
        const updated = [...prev];
        updated[existingIndex] = fileResult;
        return updated;
      } else {
        // Add new result
        return [...prev, fileResult];
      }
    });
  };

  const handleFileError = (fileError: any) => {
    console.log('File error:', fileError);
    // Add the failed file result to the file-wise results
    const errorResult = {
      filename: fileError.filename || 'Unknown File',
      file_size: 0,
      results: [],
      overall_score: 0,
      summary: `Error processing file: ${fileError.error}`,
      hasError: true
    };
    
    setFileWiseResults(prev => {
      // Check if file already exists (in case of duplicates)
      const existingIndex = prev.findIndex(result => result.filename === errorResult.filename);
      if (existingIndex >= 0) {
        // Update existing result
        const updated = [...prev];
        updated[existingIndex] = errorResult;
        return updated;
      } else {
        // Add new result
        return [...prev, errorResult];
      }
    });
  };

  const isStepCompleted = (step: number) => completedSteps.includes(step);
  
  return (
    <section id="process" className="py-20 bg-muted/30">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Get Started in{" "}
            <span className="bg-gradient-primary bg-clip-text text-transparent">
              3 Simple Steps
            </span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Our streamlined process makes call auditing effortless and efficient
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {/* Step 1 */}
          <Card className={`relative border-0 shadow-card-custom hover:shadow-primary/20 transition-all duration-300 hover:-translate-y-2 bg-card/50 backdrop-blur-sm animate-fade-in ${isStepCompleted(1) ? 'ring-2 ring-primary/20' : ''}`}>
            <div className={`absolute -top-4 left-6 w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm ${isStepCompleted(1) ? 'bg-green-500' : 'bg-gradient-primary'}`}>
              {isStepCompleted(1) ? <CheckCircle2 className="w-5 h-5" /> : '1'}
            </div>
            <CardHeader className="pt-8">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <svg
                  className="w-6 h-6 text-primary"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                  />
                </svg>
              </div>
              <CardTitle className="text-xl">Upload Calls</CardTitle>
              <CardDescription className="text-base">
                Upload up to 10 audio call files. We support all major audio formats including MP3, WAV, and M4A.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".mp3,.wav,.m4a,.aac,.flac"
                onChange={handleFileUpload}
                className="hidden"
              />
              
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <svg className="w-4 h-4 text-primary" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>Maximum 10 files</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <svg className="w-4 h-4 text-primary" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>All audio formats supported</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <svg className="w-4 h-4 text-primary" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>Secure & private</span>
                </div>
                {uploadedFiles.length > 0 && (
                <div className="mb-4">
                  <p className="text-sm text-muted-foreground mb-2">
                    {uploadedFiles.length} file(s) uploaded
                  </p>
                  <div className="space-y-1">
                    {uploadedFiles.slice(0, 3).map((file, index) => (
                      <p key={index} className="text-xs text-muted-foreground truncate">
                        {/* {file.name} */}
                      </p>
                    ))}
                    {/* {uploadedFiles.length > 3 && (
                      <p className="text-xs text-muted-foreground">
                        +{uploadedFiles.length - 3} more files
                      </p>
                    )} */}
                  </div>
                </div>
              )}
              </div>
              
              <Button 
                onClick={handleUploadClick} 
                variant={isStepCompleted(1) ? "outline" : "cta"} 
                className="w-full mt-4"
              >
                <Upload className="w-4 h-4 mr-2" />
                {isStepCompleted(1) ? 'Change Files' : 'Upload Calls'}
              </Button>
            </CardContent>
          </Card>

          {/* Step 2 */}
          <Card className={`relative border-0 shadow-card-custom hover:shadow-primary/20 transition-all duration-300 hover:-translate-y-2 bg-card/50 backdrop-blur-sm animate-fade-in ${isStepCompleted(2) ? 'ring-2 ring-primary/20' : ''}`} style={{ animationDelay: '0.2s' }}>
            <div className={`absolute -top-4 left-6 w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm ${isStepCompleted(2) ? 'bg-green-500' : 'bg-gradient-primary'}`}>
              {isStepCompleted(2) ? <CheckCircle2 className="w-5 h-5" /> : '2'}
            </div>
            <CardHeader className="pt-8">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <svg
                  className="w-6 h-6 text-primary"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                  />
                </svg>
              </div>
              <CardTitle className="text-xl">Select Audit Parameters</CardTitle>
              <CardDescription className="text-base">
                Choose from our comprehensive list of audit parameters or customize your own criteria for analysis.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <svg className="w-4 h-4 text-primary" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>Pre-built templates</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <svg className="w-4 h-4 text-primary" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>Custom parameters</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <svg className="w-4 h-4 text-primary" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>Industry-specific criteria</span>
                </div>
              </div>
              
              {selectedParameters.length > 0 && (
                <div className="mt-4 mb-4">
                  <p className="text-sm text-muted-foreground">
                    {selectedParameters.length} parameters selected
                  </p>
                </div>
              )}
              
              <AuditParametersDrawer
                selectedParameters={selectedParameters}
                onParametersChange={setSelectedParameters}
                onComplete={handleParametersComplete}
              />
            </CardContent>
          </Card>

          {/* Step 3 */}
          <Card className={`relative border-0 shadow-card-custom hover:shadow-primary/20 transition-all duration-300 hover:-translate-y-2 bg-card/50 backdrop-blur-sm animate-fade-in ${isStepCompleted(3) ? 'ring-2 ring-primary/20' : ''}`} style={{ animationDelay: '0.4s' }}>
            <div className={`absolute -top-4 left-6 w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm ${isStepCompleted(3) ? 'bg-green-500' : 'bg-gradient-primary'}`}>
              {isStepCompleted(3) ? <CheckCircle2 className="w-5 h-5" /> : '3'}
            </div>
            <CardHeader className="pt-8">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <svg
                  className="w-6 h-6 text-primary"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              <CardTitle className="text-xl">Generate Report</CardTitle>
              <CardDescription className="text-base">
                Get your comprehensive audit report with insights, scores, and actionable recommendations.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <svg className="w-4 h-4 text-primary" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span>Detailed analytics</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <svg className="w-4 h-4 text-primary" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span>Actionable insights</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <svg className="w-4 h-4 text-primary" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span>Export options</span>
                  </div>
                </div>
                              <div className="space-y-3">
                <Button 
                  variant={isStepCompleted(3) ? "outline" : "cta"} 
                  className="w-full"
                  onClick={handleGenerateReport}
                  disabled={!isStepCompleted(1) || !isStepCompleted(2) || isProcessing}
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Processing with live updates...
                    </>
                  ) : isStepCompleted(3) ? (
                    <>
                      Report Generated ✓
                      <svg
                        className="w-4 h-4 ml-2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13 7l5 5m0 0l-5 5m5-5H6"
                        />
                      </svg>
                    </>
                  ) : (
                    <>
                      Generate Report
                      <svg
                        className="w-4 h-4 ml-2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13 7l5 5m0 0l-5 5m5-5H6"
                        />
                      </svg>
                    </>
                  )}
                </Button>
              </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Progress Section */}
        {showProgress && (
          <div className="mt-16">
            <AuditProgress 
              ref={auditProgressRef}
              isVisible={showProgress}
              onComplete={handleProgressComplete}
              onError={handleProgressError}
              onFileCompleted={handleFileCompleted}
              onFileError={handleFileError}
            />
          </div>
        )}
        
        {/* File-wise Results Section */}
        {fileWiseResults.length > 0 && (
          <div className="mt-16">
            <div className="text-center mb-8">
              <h3 className="text-3xl font-bold text-foreground mb-2">
                Audit Report
              </h3>
              <p className="text-lg text-muted-foreground">
                Analysis results for each processed file ({fileWiseResults.length} of {uploadedFiles.length})
                {showProgress && (
                  <span className="block text-sm text-blue-600 mt-1">
                    <Loader2 className="w-4 h-4 inline animate-spin mr-1" />
                    More files are being processed...
                  </span>
                )}
              </p>
            </div>
            
            {/* Summary Statistics */}
            <div className="mb-8">
              <Card className="w-full max-w-4xl mx-auto">
                <CardContent className="pt-6">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">{uploadedFiles.length}</div>
                      <div className="text-xs text-muted-foreground">Total Files</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {fileWiseResults.filter(r => !r.hasError).length}
                      </div>
                      <div className="text-xs text-muted-foreground">Completed</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-red-600">
                        {fileWiseResults.filter(r => r.hasError).length}
                      </div>
                      <div className="text-xs text-muted-foreground">Failed</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">
                        {fileWiseResults.length > 0 
                          ? (fileWiseResults.filter(r => !r.hasError).length / fileWiseResults.length * 100).toFixed(0)
                          : 0}%
                      </div>
                      <div className="text-xs text-muted-foreground">Success Rate</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              {fileWiseResults.map((result, index) => (
                <Card key={index} className={`w-full max-w-4xl mx-auto transition-all duration-300 hover:shadow-lg ${
                  result.hasError 
                    ? 'border-l-4 border-l-red-500 bg-red-50/30' 
                    : 'border-l-4 border-l-green-500 bg-green-50/30'
                }`}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-3">
                      {result.hasError ? (
                        <XCircle className="w-6 h-6 text-red-500" />
                      ) : (
                        <CheckCircle2 className="w-6 h-6 text-green-500" />
                      )}
                      <span className="flex-1 font-mono text-sm">{result.filename}</span>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          #{index + 1}
                        </Badge>
                        {!result.hasError && (
                          <Badge variant="secondary">
                            Score: {result.overall_score?.toFixed(1)}%
                          </Badge>
                        )}
                      </div>
                    </CardTitle>
                    <CardDescription>
                      {result.hasError ? (
                        <span className="text-red-600 font-medium">Processing failed</span>
                      ) : (
                        <>
                          File size: {(result.file_size / 1024 / 1024).toFixed(2)} MB • 
                          Parameters analyzed: {result.results?.length || 0}
                          {result.completedAt && (
                            <span className="ml-2 text-xs text-muted-foreground">
                              • Completed at {result.completedAt.toLocaleTimeString()}
                            </span>
                          )}
                        </>
                      )}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {result.hasError ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-500" />
                        <p className="text-red-600 font-medium">{result.summary}</p>
                      </div>
                    ) : result.results && result.results.length > 0 ? (
                      <div className="space-y-3">
                        {result.results.map((paramResult: any, paramIndex: number) => (
                          <div key={paramIndex} className="flex items-start justify-between p-3 border rounded-lg bg-white/50 backdrop-blur-sm">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                {paramResult.verdict?.toLowerCase() === 'yes' ? (
                                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                                ) : paramResult.verdict?.toLowerCase() === 'no' ? (
                                  <XCircle className="w-4 h-4 text-red-500" />
                                ) : (
                                  <AlertCircle className="w-4 h-4 text-yellow-500" />
                                )}
                                <span className="font-medium capitalize">
                                  {paramResult.parameter?.replace('-', ' ')}
                                </span>
                                <Badge 
                                  variant={paramResult.verdict?.toLowerCase() === 'yes' ? 'default' : 
                                         paramResult.verdict?.toLowerCase() === 'no' ? 'destructive' : 'secondary'}
                                  className="ml-2"
                                >
                                  {paramResult.verdict}
                                </Badge>
                                <Badge variant="outline">
                                  {paramResult.confidence}
                                </Badge>
                              </div>
                              {paramResult.reasoning && (
                                <p className="text-sm text-muted-foreground leading-relaxed">
                                  {paramResult.reasoning}
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <AlertCircle className="w-12 h-12 mx-auto mb-4 text-yellow-500" />
                        <p>No detailed results available for this file</p>
                        {result.summary && (
                          <p className="text-sm mt-2">{result.summary}</p>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
        
        {/* Error Display */}
        {streamingError && (
          <div className="mt-8 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-2 text-red-800">
              <AlertCircle className="w-5 h-5" />
              <span className="font-medium">Streaming Error</span>
            </div>
            <p className="text-red-700 mt-1">{streamingError}</p>
            <Button 
              variant="outline" 
              size="sm" 
              className="mt-2"
              onClick={() => setStreamingError(null)}
            >
              Dismiss
            </Button>
          </div>
        )}
      </div>
    </section>
  );
};

export default ProcessSteps;