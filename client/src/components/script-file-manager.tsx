import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Upload, FileText, Download, Trash2, File as FileIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useFilePermissions } from "@/hooks/useFilePermissions";
import type { Submission } from "@shared/schema";

interface SubmissionFileManagerProps {
  script: Submission;
}

interface FileData {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  fileSize: number;
  entityType: string;
  entityId: string | null;
  uploadedBy: string | null;
  createdAt: string;
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function getFileIcon(mimeType: string) {
  if (mimeType.includes('pdf')) return <FileText className="h-4 w-4" />;
  if (mimeType.includes('document') || mimeType.includes('word')) return <FileText className="h-4 w-4" />;
  if (mimeType.includes('text')) return <FileText className="h-4 w-4" />;
  return <FileIcon className="h-4 w-4" />;
}

export function SubmissionFileManager({ script }: SubmissionFileManagerProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { permissions } = useFilePermissions();

  const { data: scriptFiles = [] } = useQuery<FileData[]>({
    queryKey: ['/api/files', 'scripts', script.id],
    queryFn: async () => {
      const response = await fetch(`/api/scripts/${script.id}/files`);
      if (!response.ok) return [];
      return response.json();
    }
  });

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
      const response = await fetch(`/api/scripts/${script.id}/upload`, {
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
      queryClient.invalidateQueries({ queryKey: ['/api/files'] });
      queryClient.invalidateQueries({ queryKey: ['/api/files', 'scripts', script.id] });
      
      // Reset the file input
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
    } catch (error) {
      toast({
        title: "Upload failed",
        description: "There was an error uploading your file. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDownload = (fileId: string, filename: string) => {
    window.open(`/api/files/${fileId}/download`, '_blank');
  };

  const deleteFileMutation = useMutation({
    mutationFn: async (fileId: string) => {
      const response = await fetch(`/api/files/${fileId}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete file');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/files'] });
      queryClient.invalidateQueries({ queryKey: ['/api/files', 'scripts', script.id] });
      toast({
        title: "File deleted",
        description: "File has been successfully deleted",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete file",
        variant: "destructive",
      });
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Submission Files
          <Badge variant="secondary">{scriptFiles.length} files</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* File Upload Section */}
        {permissions.canUpload ? (
          <div className="space-y-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="space-y-2">
              <Label htmlFor="script-file-upload">Upload Document</Label>
              <Input
                id="script-file-upload"
                type="file"
                accept=".pdf,.doc,.docx,.txt,.rtf"
                onChange={handleFileChange}
                className="cursor-pointer"
              />
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Supported formats: PDF, DOC, DOCX, TXT, RTF
              </p>
            </div>

            {file && (
              <div className="flex items-center gap-2 p-2 border rounded bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600">
                <FileText className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{file.name}</span>
                <span className="text-xs text-gray-600 dark:text-gray-400">
                  ({formatFileSize(file.size)})
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
        ) : (
          <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <p className="text-gray-600 dark:text-gray-400 text-center">
              You don't have permission to upload files. Only Admin and Editor users can upload files.
            </p>
          </div>
        )}

        {/* Files List */}
        <div className="space-y-3">
          <h4 className="font-medium text-gray-900 dark:text-gray-100">Uploaded Files</h4>
          {scriptFiles.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
              No files uploaded yet
            </p>
          ) : (
            <div className="space-y-2">
              {scriptFiles.map((file) => (
                <div key={file.id} className="flex items-center justify-between p-3 border rounded-lg bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600">
                  <div className="flex items-center gap-3">
                    {getFileIcon(file.mimeType)}
                    <div>
                      <p className="font-medium text-sm text-gray-900 dark:text-gray-100">{file.originalName}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {formatFileSize(file.fileSize)} • {new Date(file.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {permissions.canDownload && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownload(file.id, file.originalName)}
                      >
                        <Download className="h-3 w-3" />
                      </Button>
                    )}
                    {permissions.canDelete && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deleteFileMutation.mutate(file.id)}
                        disabled={deleteFileMutation.isPending}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}