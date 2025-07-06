import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  FolderPlus,
  Folder,
  FolderOpen,
  File,
  Search,
  MoreVertical,
  Download,
  Trash2,
  Upload,
  Tag,
  Archive
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useFilePermissions } from "@/hooks/useFilePermissions";

interface EnhancedFileManagerProps {
  entityType: string;
  entityId: string;
  title?: string;
}

interface FileFolder {
  id: string;
  name: string;
  description?: string;
  parentFolderId?: string;
  entityType: string;
  entityId: string;
  folderPath: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface EnhancedFile {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  fileSize: number;
  entityType: string;
  entityId: string;
  folderId?: string;
  uploadedBy: string;
  tags?: string[];
  description?: string;
  version: number;
  isArchived: boolean;
  filePath?: string;
  accessLevel: string;
  downloadCount: number;
  createdAt: string;
  updatedAt: string;
}

export function EnhancedFileManager({ entityType, entityId, title = "Files" }: EnhancedFileManagerProps) {
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateFolderOpen, setIsCreateFolderOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploadOpen, setIsUploadOpen] = useState(false);

  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { permissions } = useFilePermissions();

  // Get folders for this entity
  const { data: folders = [] } = useQuery<FileFolder[]>({
    queryKey: ["/api/folders", entityType, entityId],
    queryFn: async () => {
      const response = await fetch(`/api/folders?entityType=${entityType}&entityId=${entityId}`, {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch folders");
      return response.json();
    },
  });

  // Get files for this entity/folder
  const { data: files = [] } = useQuery<EnhancedFile[]>({
    queryKey: ["/api/files", entityType, entityId, selectedFolderId],
    queryFn: async () => {
      let url = `/api/files?entityType=${entityType}`;
      if (entityId) {
        url += `&entityId=${entityId}`;
      }
      if (selectedFolderId) {
        url += `&folderId=${selectedFolderId}`;
      }
      const response = await fetch(url, {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch files");
      const data = await response.json();
      return data.files || data;
    },
  });

  // Search files
  const { data: searchResults = [] } = useQuery<EnhancedFile[]>({
    queryKey: ["/api/files/search", searchQuery, entityType, entityId],
    queryFn: async () => {
      if (!searchQuery.trim()) return [];
      const response = await fetch(`/api/files/search?q=${encodeURIComponent(searchQuery)}&entityType=${entityType}&entityId=${entityId}`, {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to search files");
      return response.json();
    },
    enabled: searchQuery.length > 2,
  });

  // Create folder mutation
  const createFolderMutation = useMutation({
    mutationFn: async (folderData: { name: string; description?: string; parentFolderId?: string }) => {
      const response = await fetch("/api/folders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          ...folderData,
          entityType,
          entityId,
        }),
      });
      if (!response.ok) throw new Error("Failed to create folder");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/folders"] });
      setIsCreateFolderOpen(false);
      setNewFolderName("");
      toast({ title: "Folder created successfully" });
    },
    onError: () => {
      toast({ 
        title: "Failed to create folder", 
        variant: "destructive" 
      });
    },
  });

  // Upload file mutation
  const uploadFileMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await fetch(`/api/files/upload`, {
        method: "POST",
        credentials: "include",
        body: formData,
      });
      if (!response.ok) throw new Error("Failed to upload file");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/files"] });
      setIsUploadOpen(false);
      setSelectedFile(null);
      toast({ title: "File uploaded successfully" });
    },
    onError: () => {
      toast({ 
        title: "Failed to upload file", 
        variant: "destructive" 
      });
    },
  });

  // Delete file mutation
  const deleteFileMutation = useMutation({
    mutationFn: async (fileId: string) => {
      const response = await fetch(`/api/files/${fileId}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to delete file");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/files"] });
      toast({ title: "File deleted successfully" });
    },
    onError: () => {
      toast({ 
        title: "Failed to delete file", 
        variant: "destructive" 
      });
    },
  });

  const handleCreateFolder = () => {
    if (!newFolderName.trim()) return;
    createFolderMutation.mutate({
      name: newFolderName.trim(),
      parentFolderId: selectedFolderId || undefined,
    });
  };

  const handleFileUpload = () => {
    if (!selectedFile) return;
    
    const formData = new FormData();
    formData.append("file", selectedFile);
    formData.append("entityType", entityType);
    formData.append("entityId", entityId);
    if (selectedFolderId) {
      formData.append("folderId", selectedFolderId);
    }
    
    uploadFileMutation.mutate(formData);
  };

  const handleDownloadFile = async (file: EnhancedFile) => {
    try {
      const response = await fetch(`/api/files/${file.id}/download`, {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to download file");
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = file.originalName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      toast({ 
        title: "Failed to download file", 
        variant: "destructive" 
      });
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const displayFiles = searchQuery.length > 2 ? searchResults : files;

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center gap-2">
            <FolderOpen className="h-5 w-5" />
            {title}
          </CardTitle>
          <div className="flex gap-2">
            {permissions?.canCreate && (
              <>
                <Dialog open={isCreateFolderOpen} onOpenChange={setIsCreateFolderOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      <FolderPlus className="h-4 w-4 mr-2" />
                      New Folder
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Create New Folder</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <Input
                        placeholder="Folder name"
                        value={newFolderName}
                        onChange={(e) => setNewFolderName(e.target.value)}
                        onKeyPress={(e) => e.key === "Enter" && handleCreateFolder()}
                      />
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setIsCreateFolderOpen(false)}>
                          Cancel
                        </Button>
                        <Button onClick={handleCreateFolder} disabled={!newFolderName.trim()}>
                          Create
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>

                <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm">
                      <Upload className="h-4 w-4 mr-2" />
                      Upload File
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Upload File</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <Input
                        type="file"
                        onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                      />
                      {selectedFolderId && (
                        <p className="text-sm text-muted-foreground">
                          Uploading to folder: {folders.find(f => f.id === selectedFolderId)?.name}
                        </p>
                      )}
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setIsUploadOpen(false)}>
                          Cancel
                        </Button>
                        <Button onClick={handleFileUpload} disabled={!selectedFile}>
                          Upload
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </>
            )}
          </div>
        </div>
        
        {/* Search bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search files..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Folder breadcrumb and navigation */}
        {selectedFolderId && (
          <div className="flex items-center gap-2 p-2 bg-muted rounded">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setSelectedFolderId(null)}
            >
              ← Back to root
            </Button>
            <span className="text-sm text-muted-foreground">
              Current folder: {folders.find(f => f.id === selectedFolderId)?.name}
            </span>
          </div>
        )}

        {/* Folders list */}
        {!searchQuery && folders.filter(f => f.parentFolderId === selectedFolderId).length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-muted-foreground">Folders</h4>
            <div className="grid gap-2">
              {folders
                .filter(folder => folder.parentFolderId === selectedFolderId)
                .map((folder) => (
                  <div
                    key={folder.id}
                    className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/50 cursor-pointer"
                    onClick={() => setSelectedFolderId(folder.id)}
                  >
                    <Folder className="h-5 w-5 text-blue-500" />
                    <div className="flex-1">
                      <p className="font-medium">{folder.name}</p>
                      {folder.description && (
                        <p className="text-sm text-muted-foreground">{folder.description}</p>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Files list */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-muted-foreground">Files</h4>
          {displayFiles.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              {searchQuery ? "No files found matching your search" : "No files uploaded yet"}
            </p>
          ) : (
            <div className="grid gap-2">
              {displayFiles.map((file) => (
                <div key={file.id} className="flex items-center gap-3 p-3 border rounded-lg">
                  <File className="h-5 w-5 text-gray-500" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{file.originalName}</p>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span>{formatFileSize(file.fileSize)}</span>
                      <span>v{file.version}</span>
                      {file.tags && file.tags.length > 0 && (
                        <div className="flex gap-1">
                          {file.tags.slice(0, 2).map((tag, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                          {file.tags.length > 2 && (
                            <span className="text-xs">+{file.tags.length - 2}</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {permissions?.canDownload && (
                        <DropdownMenuItem onClick={() => handleDownloadFile(file)}>
                          <Download className="h-4 w-4 mr-2" />
                          Download
                        </DropdownMenuItem>
                      )}
                      {permissions?.canDelete && (
                        <DropdownMenuItem 
                          onClick={() => deleteFileMutation.mutate(file.id)}
                          className="text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}