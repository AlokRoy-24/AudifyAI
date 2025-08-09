import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import AuditParametersDrawer from "./AuditParametersDrawer";
import { CheckCircle2, Upload, Loader2, Zap } from "lucide-react";
import apiService, { AuditResponse, StreamEvent } from "@/services/api";
import { useToast } from "@/hooks/use-toast";
import AuditResults from "./AuditResults";
import AuditProgress from "./AuditProgress";

const ProcessSteps = () => {
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [selectedParameters, setSelectedParameters] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showProgress, setShowProgress] = useState(false);
  const [auditResults, setAuditResults] = useState<AuditResponse | null>(null);
  const [useStreaming, setUseStreaming] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const auditProgressRef = useRef<{ handleStreamEvent: (event: StreamEvent) => void }>(null);
  const { toast } = useToast();

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length > 10) {
      alert("Maximum 10 files allowed");
      return;
    }
    setUploadedFiles(files);
    if (files.length > 0 && !completedSteps.includes(1)) {
      setCompletedSteps(prev => [...prev, 1]);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleParametersComplete = () => {
    if (!completedSteps.includes(2)) {
      setCompletedSteps(prev => [...prev, 2]);
    }
  };

  const handleGenerateReport = async () => {
    if (completedSteps.includes(1) && completedSteps.includes(2)) {
      if (!completedSteps.includes(3)) {
        setCompletedSteps(prev => [...prev, 3]);
      }
      
      setIsProcessing(true);
      
      try {
        if (useStreaming) {
          // Use streaming for real-time progress
          setShowProgress(true);
          
          const results = await apiService.performAuditStream(
            uploadedFiles, 
            {
              parameters: selectedParameters,
              custom_prompts: {}
            },
            handleStreamEvent
          );
          
          // Results will be set via progress completion
          
        } else {
          // Use optimized non-streaming method
          const results = await apiService.performAudit(uploadedFiles, {
            parameters: selectedParameters,
            custom_prompts: {}
          });
          
          setAuditResults(results);
          
          toast({
            title: "Audit Complete!",
            description: `Successfully processed ${results.processed_files} files in ${results.processing_time?.toFixed(1)}s.`,
          });
        }
        
      } catch (error) {
        console.error('Audit failed:', error);
        setShowProgress(false);
        toast({
          title: "Audit Failed",
          description: error instanceof Error ? error.message : "An error occurred during the audit.",
          variant: "destructive",
        });
        
        // Remove step 3 if it was added
        setCompletedSteps(prev => prev.filter(step => step !== 3));
      } finally {
        if (!useStreaming) {
          setIsProcessing(false);
        }
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
    console.log('Stream event:', event);
    
    // Pass the event to the AuditProgress component if it's visible
    if (auditProgressRef.current) {
      auditProgressRef.current.handleStreamEvent(event);
    }
  };

  const handleProgressComplete = (results: any) => {
    setIsProcessing(false);
    setShowProgress(false);
    
    // Convert progress results to AuditResponse format
    const auditResponse: AuditResponse = {
      audit_id: results.audit_id,
      total_files: results.total_files,
      processed_files: results.processed_files,
      results: results.fileResults || [], // Use the collected file results
      overall_summary: results.overall_summary,
      generated_at: new Date().toISOString(),
      processing_time: results.processing_time
    };
    
    setAuditResults(auditResponse);
    
    toast({
      title: "Audit Complete!",
      description: `Successfully processed ${results.processed_files} files in ${results.processing_time?.toFixed(1)}s with real-time updates.`,
    });
  };

  const handleProgressError = (error: string) => {
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
                    {uploadedFiles.length > 3 && (
                      <p className="text-xs text-muted-foreground">
                        +{uploadedFiles.length - 3} more files
                      </p>
                    )}
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
                {/* Streaming Toggle */}
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Real-time progress:</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setUseStreaming(!useStreaming)}
                      className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors ${
                        useStreaming 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      <Zap className="w-3 h-3" />
                      {useStreaming ? 'Enabled' : 'Disabled'}
                    </button>
                  </div>
                </div>

                <Button 
                  variant={isStepCompleted(3) ? "outline" : "cta"} 
                  className="w-full"
                  onClick={handleGenerateReport}
                  disabled={!isStepCompleted(1) || !isStepCompleted(2) || isProcessing}
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      {useStreaming ? 'Processing with live updates...' : 'Processing...'}
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
                      {useStreaming ? (
                        <>
                          <Zap className="w-4 h-4 mr-2" />
                          Generate Report (Live)
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
            />
          </div>
        )}
        
        {/* Results Section */}
        {auditResults && !showProgress && (
          <div className="mt-16">
            <AuditResults results={auditResults} />
          </div>
        )}
        
        {/* Footnote
        <div className="text-center mt-16">
          <p className="text-sm text-muted-foreground">
            Created with ❤️ by alumni of IIT Kharagpur
          </p>
        </div> */}
      </div>
    </section>
  );
};

export default ProcessSteps;