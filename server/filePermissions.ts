import type { User } from "@shared/schema";

export interface FilePermissions {
  canView: boolean;
  canDownload: boolean;
  canUpload: boolean;
  canEdit: boolean;
  canDelete: boolean;
}

export function getFilePermissions(user: User | undefined): FilePermissions {
  if (!user) {
    return {
      canView: false,
      canDownload: false,
      canUpload: false,
      canEdit: false,
      canDelete: false,
    };
  }

  const role = user.role;

  switch (role) {
    case 'admin':
      return {
        canView: true,
        canDownload: true,
        canUpload: true,
        canEdit: true,
        canDelete: true,
      };
    case 'editor':
      return {
        canView: true,
        canDownload: true,
        canUpload: true,
        canEdit: true,
        canDelete: true,
      };
    case 'member':
    default:
      return {
        canView: true,
        canDownload: false,
        canUpload: false,
        canEdit: false,
        canDelete: false,
      };
  }
}

export function requireFilePermission(permission: keyof FilePermissions, user: User | undefined): boolean {
  const permissions = getFilePermissions(user);
  return permissions[permission];
}