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
    case 'organizer':
      return {
        canView: true,
        canDownload: true,
        canUpload: true,
        canEdit: true,
        canDelete: true,
      };
    case 'editor':
    case 'analyzer':
      return {
        canView: true,
        canDownload: true,
        canUpload: true,
        canEdit: true,
        canDelete: true,
      };
    case 'member':
    case 'participant':
      return {
        canView: true,
        canDownload: true,
        canUpload: true,
        canEdit: false,
        canDelete: false,
      };
    case 'contributor':
      return {
        canView: true,
        canDownload: true,
        canUpload: true,
        canEdit: false,
        canDelete: false,
      };
    default:
      return {
        canView: true,
        canDownload: true,
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