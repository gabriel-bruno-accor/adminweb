import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ExportButtons } from "@/components/ui/export-buttons";
import { SqlQueryResult } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { Loader2, CheckCircle, XCircle, Play } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface SqlEditorProps {
  initialQuery?: string;
}

export function SqlEditor({ initialQuery = "" }: SqlEditorProps) {
  const [sql, setSql] = useState(initialQuery);
  const [result, setResult] = useState<SqlQueryResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const editorRef = useRef<HTMLTextAreaElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Execute query with Ctrl+Enter
      if (e.ctrlKey && e.key === "Enter" && !isLoading) {
        e.preventDefault();
        executeQuery();
      }
    };

    const editor = editorRef.current;
    if (editor) {
      editor.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      if (editor) {
        editor.removeEventListener("keydown", handleKeyDown);
      }
    };
  }, [sql, isLoading]);

  const executeQuery = async () => {
    if (!sql.trim()) {
      toast({
        title: "Empty Query",
        description: "Please enter a SQL query to execute",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const res = await apiRequest("POST", "/api/query", { sql });
      const data = await res.json();
      setResult(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An unknown error occurred";
      setError(errorMessage);
      toast({
        title: "Query Execution Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const clearQuery = () => {
    setSql("");
    setResult(null);
    setError(null);
    if (editorRef.current) {
      editorRef.current.focus();
    }
  };

  const handleExport = (format: 'csv' | 'json') => {
    if (!result || !result.rows.length) {
      toast({
        title: "Nothing to Export",
        description: "Execute a query that returns data first",
        variant: "destructive",
      });
      return;
    }
    
    let output = '';
    const filename = `query_result_${new Date().toISOString().split('T')[0]}.${format}`;
    
    if (format === 'csv') {
      // Headers
      output = result.columns.join(',') + '\n';
      
      // Rows
      result.rows.forEach(row => {
        output += result.columns.map(col => {
          const value = row[col];
          // Wrap in quotes if it's a string and might contain commas
          return typeof value === 'string' ? `"${value}"` : value;
        }).join(',') + '\n';
      });
    } else {
      // JSON format
      output = JSON.stringify(result.rows, null, 2);
    }
    
    // Create and trigger download
    const blob = new Blob([output], { type: format === 'csv' ? 'text/csv' : 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="grid grid-cols-1 gap-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle>SQL Query Editor</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="border border-slate-300 rounded-md overflow-hidden">
            <textarea
              ref={editorRef}
              value={sql}
              onChange={(e) => setSql(e.target.value)}
              className="w-full h-64 font-mono text-sm p-4 focus:outline-none"
              placeholder="Enter SQL query here..."
            />
          </div>
        </CardContent>
        <CardFooter className="flex items-center justify-between">
          <div className="text-sm text-slate-600">
            Press Ctrl+Enter to execute
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              onClick={clearQuery}
              disabled={isLoading}
            >
              Clear
            </Button>
            <Button
              onClick={executeQuery}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Executing...
                </>
              ) : (
                <>
                  <Play className="mr-2 h-4 w-4" />
                  Execute
                </>
              )}
            </Button>
          </div>
        </CardFooter>
      </Card>

      {(result || error) && (
        <Card>
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <CardTitle>Results</CardTitle>
            {result && result.rows.length > 0 && (
              <ExportButtons onExport={handleExport} />
            )}
          </CardHeader>
          <CardContent>
            {error ? (
              <div className="bg-red-50 border border-red-200 rounded-md p-4">
                <div className="flex items-center">
                  <XCircle className="h-5 w-5 text-red-500 mr-2" />
                  <div className="text-sm text-red-700 whitespace-pre-wrap">{error}</div>
                </div>
              </div>
            ) : result ? (
              <>
                {result.rows.length > 0 ? (
                  <div className="overflow-x-auto border border-slate-200 rounded-md">
                    <table className="min-w-full divide-y divide-slate-200">
                      <thead className="bg-slate-50">
                        <tr>
                          {result.columns.map((column) => (
                            <th
                              key={column}
                              scope="col"
                              className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider"
                            >
                              {column}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-slate-200">
                        {result.rows.map((row, rowIndex) => (
                          <tr key={rowIndex} className="hover:bg-slate-50">
                            {result.columns.map((column) => (
                              <td
                                key={`${rowIndex}-${column}`}
                                className="px-6 py-4 whitespace-nowrap text-sm text-slate-600"
                              >
                                {row[column] !== null && row[column] !== undefined
                                  ? String(row[column])
                                  : "NULL"}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-sm text-slate-600">
                    Query executed successfully, but no results were returned.
                  </div>
                )}

                <div className="mt-3 flex items-center text-sm text-slate-600">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                  {result.message} Query executed in {result.executionTime.toFixed(3)}s
                </div>
              </>
            ) : null}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
