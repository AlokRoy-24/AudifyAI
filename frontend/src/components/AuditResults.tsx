import { AuditResponse } from "@/services/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, AlertCircle } from "lucide-react";

interface AuditResultsProps {
  results: AuditResponse;
}

const AuditResults = ({ results }: AuditResultsProps) => {
  const getVerdictIcon = (verdict: string) => {
    switch (verdict.toLowerCase()) {
      case 'yes':
        return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case 'no':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <AlertCircle className="w-4 h-4 text-yellow-500" />;
    }
  };

  const getVerdictColor = (verdict: string) => {
    switch (verdict.toLowerCase()) {
      case 'yes':
        return 'bg-green-100 text-green-800';
      case 'no':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Summary Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-green-500" />
            Audit Complete
          </CardTitle>
          <CardDescription>
            {results.overall_summary}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{results.total_files}</div>
              <div className="text-sm text-muted-foreground">Total Files</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{results.processed_files}</div>
              <div className="text-sm text-muted-foreground">Processed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{results.audit_id.slice(0, 8)}</div>
              <div className="text-sm text-muted-foreground">Audit ID</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {results.processing_time ? `${results.processing_time.toFixed(1)}s` : 'N/A'}
              </div>
              <div className="text-sm text-muted-foreground">Processing Time</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* File Results */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">File Results</h3>
        {results.results.map((fileResult, fileIndex) => (
          <Card key={fileIndex}>
            <CardHeader>
              <CardTitle className="text-base">{fileResult.filename}</CardTitle>
              <CardDescription>
                Size: {(fileResult.file_size / 1024 / 1024).toFixed(2)} MB
                {fileResult.overall_score !== null && (
                  <span className="ml-2">
                    • Score: <Badge variant="secondary">{fileResult.overall_score.toFixed(1)}%</Badge>
                  </span>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {fileResult.summary ? (
                <div className="text-sm text-muted-foreground bg-muted p-3 rounded">
                  {fileResult.summary}
                </div>
              ) : (
                <div className="space-y-3">
                  {fileResult.results.map((result, resultIndex) => (
                    <div key={resultIndex} className="flex items-start justify-between p-3 border rounded">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          {getVerdictIcon(result.verdict)}
                          <span className="font-medium capitalize">{result.parameter.replace('-', ' ')}</span>
                          <Badge className={getVerdictColor(result.verdict)}>
                            {result.verdict}
                          </Badge>
                          <Badge variant="outline">{result.confidence}</Badge>
                        </div>
                        {result.reasoning && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {result.reasoning}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default AuditResults; 