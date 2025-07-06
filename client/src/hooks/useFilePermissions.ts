import { useQuery } from "@tanstack/react-query";

export interface FilePermissions {
  canView: boolean;
  canDownload: boolean;
  canUpload: boolean;
  canEdit: boolean;
  canDelete: boolean;
}

export function useFilePermissions() {
  const { data: permissions, isLoading } = useQuery<FilePermissions>({
    queryKey: ["/api/auth/permissions"],
    retry: false,
  });

  return {
    permissions: permissions || {
      canView: false,
      canDownload: false,
      canUpload: false,
      canEdit: false,
      canDelete: false,
    },
    isLoading,
  };
}