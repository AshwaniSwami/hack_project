import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trash2, Download, Eye, FileText, Image, Music, Video, File as FileIcon, GripVertical, ArrowUp, ArrowDown, RotateCcw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useFilePermissions } from "@/hooks/useFilePermissions";
import { decodeFileName } from "@/utils/textUtils";

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
  const { permissions, isLoading: permissionsLoading } = useFilePermissions();
  const [isReordering, setIsReordering] = useState(false);
  const [draggedItem, setDraggedItem] = useState<number | null>(null);
  const [localFiles, setLocalFiles] = useState<FileData[]>([]);

  const { data: filesResponse = { files: [] }, isLoading, refetch } = useQuery({
    queryKey: ['/api/files', entityType, entityId],
    queryFn: async () => {
      const url = `/api/files?entityType=${entityType}${entityId ? `&entityId=${entityId}` : ''}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch files');
      const data = await response.json();
      return data.files ? data : { files: Array.isArray(data) ? data : [] };
    },
    staleTime: 0,
    refetchInterval: 2000,
  });

  const deleteMutation = useMutation({
    mutationFn: async (fileId: string) => {
      const response = await fetch(`/api/files/${fileId}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to delete file');
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/files'] });
      queryClient.invalidateQueries({ queryKey: ['/api/episodes'] });
      queryClient.invalidateQueries({ queryKey: ['/api/scripts'] });
      queryClient.invalidateQueries({ queryKey: ['/api/projects'] });
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

  const reorderMutation = useMutation({
    mutationFn: async ({ entityType, entityId, fileIds }: { entityType: string; entityId: string | null; fileIds: string[] }) => {
      const response = await fetch('/api/files/reorder', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ entityType, entityId, fileIds }),
      });
      if (!response.ok) throw new Error('Failed to reorder files');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/files'] });
      toast({
        title: "Success",
        description: "Files reordered successfully",
      });
      setIsReordering(false);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to reorder files",
        variant: "destructive",
      });
    },
  });

  const handleView = (fileId: string) => {
    window.open(`/api/files/${fileId}/view`, '_blank');
  };

  const handleDownload = async (fileId: string, filename: string) => {
    try {
      const response = await fetch(`/api/files/${fileId}/download`);
      if (!response.ok) throw new Error("Failed to download file");
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(link);
      
      // Refresh data to show updated download count
      queryClient.invalidateQueries({ queryKey: ['/api/files'] });
      
      toast({
        title: "Download started",
        description: `${filename} is being downloaded`,
      });
    } catch (error) {
      toast({
        title: "Download failed",
        description: "Failed to download the file",
        variant: "destructive",
      });
    }
  };

  const handleDelete = (fileId: string) => {
    if (confirm('Are you sure you want to delete this file?')) {
      deleteMutation.mutate(fileId);
    }
  };

  // Reordering functions
  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const newFiles = [...(localFiles.length > 0 ? localFiles : files)];
    [newFiles[index], newFiles[index - 1]] = [newFiles[index - 1], newFiles[index]];
    setLocalFiles(newFiles);
  };

  const handleMoveDown = (index: number) => {
    const fileArray = localFiles.length > 0 ? localFiles : files;
    if (index === fileArray.length - 1) return;
    const newFiles = [...fileArray];
    [newFiles[index], newFiles[index + 1]] = [newFiles[index + 1], newFiles[index]];
    setLocalFiles(newFiles);
  };

  const handleSaveOrder = () => {
    const fileIds = localFiles.map(file => file.id);
    reorderMutation.mutate({
      entityType,
      entityId: entityId || null,
      fileIds
    });
  };

  const handleCancelReorder = () => {
    setLocalFiles([]);
    setIsReordering(false);
  };

  const handleStartReorder = () => {
    setLocalFiles([...files]);
    setIsReordering(true);
  };

  const files = filesResponse.files || [];
  const displayFiles = isReordering ? localFiles : files;

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

  if (!files || files.length === 0) {
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
          <div className="flex items-center space-x-2">
            <Badge variant="secondary">{displayFiles.length} file{displayFiles.length !== 1 ? 's' : ''}</Badge>
            {permissions.canEdit && displayFiles.length > 1 && (
              <>
                {!isReordering ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleStartReorder}
                    className="h-6 px-2 text-xs"
                  >
                    <GripVertical className="h-3 w-3 mr-1" />
                    Reorder
                  </Button>
                ) : (
                  <div className="flex items-center space-x-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleSaveOrder}
                      disabled={reorderMutation.isPending}
                      className="h-6 px-2 text-xs bg-green-50 hover:bg-green-100"
                    >
                      Save
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCancelReorder}
                      className="h-6 px-2 text-xs"
                    >
                      Cancel
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {displayFiles && displayFiles.map((file: FileData, index: number) => (
            <div key={file.id} className={`flex items-center justify-between p-3 border rounded-lg ${isReordering ? 'bg-blue-50 border-blue-200' : ''}`}>
              <div className="flex items-center space-x-3">
                {getFileIcon(file.mimeType)}
                <div>
                  <p className="font-medium text-sm" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
                    {decodeFileName(file.originalName)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatFileSize(file.fileSize)} • {new Date(file.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {isReordering && (
                  <div className="flex items-center space-x-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleMoveUp(index)}
                      disabled={index === 0}
                      className="h-7 w-7 p-0"
                    >
                      <ArrowUp className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleMoveDown(index)}
                      disabled={index === displayFiles.length - 1}
                      className="h-7 w-7 p-0"
                    >
                      <ArrowDown className="h-3 w-3" />
                    </Button>
                  </div>
                )}
                {!isReordering && (
                  <>
                    {canPreview(file.mimeType) && permissions.canView && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleView(file.id)}
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        View
                      </Button>
                    )}
                    {permissions.canDownload && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownload(file.id, file.originalName)}
                      >
                        <Download className="h-3 w-3 mr-1" />
                        Download
                      </Button>
                    )}
                    {permissions.canDelete && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(file.id)}
                        disabled={deleteMutation.isPending}
                      >
                        <Trash2 className="h-3 w-3 mr-1" />
                        Delete
                      </Button>
                    )}
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}