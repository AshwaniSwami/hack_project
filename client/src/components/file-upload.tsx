import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface FileUploadProps {
  endpoint: string;
  onUploadSuccess: () => void;
  acceptedTypes?: string;
  title: string;
}

export function FileUpload({ endpoint, onUploadSuccess, acceptedTypes = ".json,.txt,.csv", title }: FileUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    setFile(selectedFile || null);
  };

  const handleUpload = async () => {
    if (!file) {
      toast({
        title: "No file selected",
        description: "Please select a file to upload",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch(`/api/${endpoint}/upload`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Upload failed");
      }

      const result = await response.json();
      toast({
        title: "Upload successful",
        description: result.message,
      });

      setFile(null);
      onUploadSuccess();
      
      // Reset the file input
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
    } catch (error) {
      console.error("Upload error:", error);
      toast({
        title: "Upload failed",
        description: "There was an error uploading your file. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-4 p-4 border rounded-lg bg-card">
      <div className="flex items-center gap-2">
        <Upload className="h-5 w-5" />
        <h3 className="text-lg font-semibold">{title}</h3>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="file-upload">Select file to upload</Label>
        <Input
          id="file-upload"
          type="file"
          accept={acceptedTypes}
          onChange={handleFileChange}
          className="cursor-pointer"
        />
        <p className="text-sm text-muted-foreground">
          Supported formats: {acceptedTypes.replace(/\./g, '').toUpperCase()}
        </p>
      </div>

      {file && (
        <div className="flex items-center gap-2 p-2 border rounded bg-muted">
          <FileText className="h-4 w-4" />
          <span className="text-sm font-medium">{file.name}</span>
          <span className="text-xs text-muted-foreground">
            ({(file.size / 1024).toFixed(1)} KB)
          </span>
        </div>
      )}

      <Button 
        onClick={handleUpload} 
        disabled={!file || isUploading}
        className="w-full"
      >
        {isUploading ? "Uploading..." : "Upload File"}
      </Button>
    </div>
  );
}