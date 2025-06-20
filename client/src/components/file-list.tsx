import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trash2, Download, Eye, FileText, Image, Music, Video, File as FileIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface FileListProps {
  entityType: string;
  entityId?: string;
  title?: string;
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

function getFileIcon(mimeType: string) {
  if (mimeType.startsWith('image/')) return <Image className="h-4 w-4" />;
  if (mimeType.startsWith('audio/')) return <Music className="h-4 w-4" />;
  if (mimeType.startsWith('video/')) return <Video className="h-4 w-4" />;
  if (mimeType.includes('pdf')) return <FileText className="h-4 w-4" />;
  if (mimeType.includes('document') || mimeType.includes('word')) return <FileText className="h-4 w-4" />;
  return <FileIcon className="h-4 w-4" />;
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function canPreview(mimeType: string): boolean {
  return mimeType.startsWith('image/') || 
         mimeType.startsWith('audio/') || 
         mimeType.startsWith('video/') || 
         mimeType === 'application/pdf' ||
         mimeType.startsWith('text/');
}

export function FileList({ entityType, entityId, title = "Files" }: FileListProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: files = [], isLoading, refetch } = useQuery<FileData[]>({
    queryKey: ['/api/files', entityType, entityId],
    queryFn: async () => {
      const url = `/api/files?entityType=${entityType}${entityId ? `&entityId=${entityId}` : ''}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch files');
      return response.json() as Promise<FileData[]>;
    },
    staleTime: 0,
    cacheTime: 0,
  });

  const deleteMutation = useMutation({
    mutationFn: async (fileId: string) => {
      const response = await fetch(`/api/files/${fileId}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to delete file');
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/files'] });
      queryClient.refetchQueries({ queryKey: ['/api/files'] });
      toast({
        title: "Success",
        description: "File deleted successfully",
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

  const handleView = (fileId: string) => {
    window.open(`/api/files/${fileId}/view`, '_blank');
  };

  const handleDownload = (fileId: string, filename: string) => {
    const link = document.createElement('a');
    link.href = `/api/files/${fileId}/download`;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDelete = (fileId: string) => {
    if (confirm('Are you sure you want to delete this file?')) {
      deleteMutation.mutate(fileId);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Loading files...</p>
        </CardContent>
      </Card>
    );
  }

  if (files.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No files uploaded yet.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          {title}
          <Badge variant="secondary">{files.length} file{files.length !== 1 ? 's' : ''}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {files.map((file: FileData) => (
            <div key={file.id} className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center space-x-3">
                {getFileIcon(file.mimeType)}
                <div>
                  <p className="font-medium text-sm">{file.originalName}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatFileSize(file.fileSize)} • {new Date(file.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {canPreview(file.mimeType) && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleView(file.id)}
                  >
                    <Eye className="h-3 w-3 mr-1" />
                    View
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDownload(file.id, file.originalName)}
                >
                  <Download className="h-3 w-3 mr-1" />
                  Download
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDelete(file.id)}
                  disabled={deleteMutation.isPending}
                >
                  <Trash2 className="h-3 w-3 mr-1" />
                  Delete
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}