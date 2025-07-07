import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, Eye, Clock, Users } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { getFilePermissions } from "@/lib/permissions";

interface FileDownloadButtonProps {
  fileId: string;
  filename: string;
  originalName: string;
  downloadCount?: number;
  fileSize?: number;
  lastAccessedAt?: string;
  className?: string;
}

function formatBytes(bytes: number): string {
  if (!bytes) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

export function FileDownloadButton({ 
  fileId, 
  filename, 
  originalName, 
  downloadCount = 0, 
  fileSize,
  lastAccessedAt,
  className = "" 
}: FileDownloadButtonProps) {
  const [isDownloading, setIsDownloading] = useState(false);
  const { user } = useAuth();
  
  const permissions = getFilePermissions(user);

  const handleDownload = async () => {
    if (!permissions.canDownload) {
      alert("You don't have permission to download files");
      return;
    }

    setIsDownloading(true);
    try {
      const response = await fetch(`/api/files/${fileId}/download`);
      
      if (!response.ok) {
        throw new Error(`Download failed: ${response.statusText}`);
      }

      // Get the file content as blob
      const blob = await response.blob();
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = originalName || filename;
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      window.URL.revokeObjectURL(url);
      document.body.removeChild(link);
      
      // Refresh the page data to show updated download count
      window.location.reload();
      
    } catch (error) {
      console.error("Download error:", error);
      alert("Failed to download file. Please try again.");
    } finally {
      setIsDownloading(false);
    }
  };

  if (!permissions.canDownload) {
    return (
      <div className={`flex items-center gap-2 text-gray-500 ${className}`}>
        <Eye className="h-4 w-4" />
        <span className="text-sm">View Only</span>
        {downloadCount > 0 && (
          <Badge variant="secondary" className="text-xs">
            {downloadCount} downloads
          </Badge>
        )}
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Button
        onClick={handleDownload}
        disabled={isDownloading}
        size="sm"
        variant="outline"
        className="flex items-center gap-2 hover:bg-blue-50 dark:hover:bg-blue-900/20"
      >
        <Download className="h-4 w-4" />
        {isDownloading ? "Downloading..." : "Download"}
      </Button>
      
      {/* Download Statistics */}
      <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
        {downloadCount > 0 && (
          <Badge variant="secondary" className="text-xs flex items-center gap-1">
            <Users className="h-3 w-3" />
            {downloadCount}
          </Badge>
        )}
        
        {fileSize && (
          <span className="text-xs">{formatBytes(fileSize)}</span>
        )}
        
        {lastAccessedAt && (
          <div className="flex items-center gap-1 text-xs">
            <Clock className="h-3 w-3" />
            Last: {new Date(lastAccessedAt).toLocaleDateString()}
          </div>
        )}
      </div>
    </div>
  );
}