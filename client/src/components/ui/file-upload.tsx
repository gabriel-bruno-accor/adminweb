import { UploadCloud } from "lucide-react";
import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";

interface FileUploadProps {
  accept?: string;
  onDataReady: (data: any[]) => Promise<void>;
  buttonText?: string;
  disabled?: boolean;
}

export function FileUpload({
  accept = ".json,.csv",
  onDataReady,
  buttonText = "Upload File",
  disabled = false
}: FileUploadProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const parseCSV = (text: string): any[] => {
    const lines = text.split("\n");
    if (lines.length < 2) return [];
    
    const headers = lines[0].split(",").map(h => h.trim());
    const result = [];
    
    for (let i = 1; i < lines.length; i++) {
      if (!lines[i].trim()) continue;
      
      const values = lines[i].split(",").map(v => v.trim());
      const obj: Record<string, string> = {};
      
      headers.forEach((header, index) => {
        obj[header] = values[index] || "";
      });
      
      result.push(obj);
    }
    
    return result;
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setProgress(10);

    try {
      const reader = new FileReader();
      
      reader.onload = async (event) => {
        try {
          setProgress(50);
          const content = event.target?.result as string;
          let data: any[] = [];

          if (file.name.endsWith('.json')) {
            const parsedData = JSON.parse(content);
            if (!Array.isArray(parsedData)) {
              // Check if the JSON is in a common format where data is nested under a 'data' key
              const typedData = parsedData as Record<string, unknown>;
              if (typedData.data && Array.isArray(typedData.data)) {
                data = typedData.data;
              } else {
                throw new Error('JSON file must contain an array of objects');
              }
            } else {
              // It's already an array
              data = parsedData;
            }
          } else if (file.name.endsWith('.csv')) {
            data = parseCSV(content);
          } else {
            throw new Error('Unsupported file format');
          }

          setProgress(75);
          await onDataReady(data);
          setProgress(100);
          
          toast({
            title: "Upload successful",
            description: `${data.length} records processed`,
          });
        } catch (error) {
          console.error('Error processing file:', error);
          toast({
            title: "Upload failed",
            description: error instanceof Error ? error.message : "Unknown error",
            variant: "destructive",
          });
        } finally {
          setUploading(false);
          setProgress(0);
          // Reset the file input
          if (fileInputRef.current) {
            fileInputRef.current.value = '';
          }
        }
      };

      reader.onerror = () => {
        toast({
          title: "Upload failed",
          description: "Error reading file",
          variant: "destructive",
        });
        setUploading(false);
        setProgress(0);
      };

      reader.readAsText(file);
    } catch (error) {
      console.error('File upload error:', error);
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
      setUploading(false);
      setProgress(0);
    }
  };

  return (
    <div className="w-full">
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept={accept}
        onChange={handleFileChange}
        disabled={disabled || uploading}
      />
      <Button
        variant="outline"
        className="w-full"
        disabled={disabled || uploading}
        onClick={() => fileInputRef.current?.click()}
      >
        <UploadCloud className="mr-2 h-4 w-4" />
        {buttonText}
      </Button>
      {uploading && (
        <div className="mt-2">
          <Progress value={progress} className="h-2" />
          <p className="text-xs text-center mt-1 text-muted-foreground">Processing...</p>
        </div>
      )}
    </div>
  );
}