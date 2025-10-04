import type { User, File } from "@shared/schema";

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

export function canBypassUploadOnce(user: User | undefined): boolean {
  if (!user) return false;
  const role = user.role;
  return role === 'admin' || role === 'organizer' || role === 'analyzer' || role === 'editor';
}

export function isParticipantOrMember(user: User | undefined): boolean {
  if (!user) return false;
  const role = user.role;
  return role === 'participant' || role === 'member';
}

export async function checkUploadOnceViolation(
  user: User | undefined,
  entityType: string,
  entityId: string,
  existingFiles: File[]
): Promise<{ allowed: boolean; message?: string }> {
  if (!user) {
    return { allowed: false, message: "User not authenticated" };
  }

  if (canBypassUploadOnce(user)) {
    return { allowed: true };
  }

  if (isParticipantOrMember(user)) {
    const userFiles = existingFiles.filter(
      f => f.uploadedBy === user.id || f.uploadedBy === user.email
    );
    
    if (userFiles.length > 0) {
      return {
        allowed: false,
        message: "Participants can only upload one file per entity. You have already uploaded a file to this entity."
      };
    }
  }

  return { allowed: true };
}

export async function checkEditDeletePermission(
  user: User | undefined,
  file: File
): Promise<{ allowed: boolean; message?: string }> {
  if (!user) {
    return { allowed: false, message: "User not authenticated" };
  }

  if (canBypassUploadOnce(user)) {
    return { allowed: true };
  }

  if (isParticipantOrMember(user)) {
    return {
      allowed: false,
      message: "Participants and members cannot edit or delete uploaded files. Please contact an organizer or analyzer."
    };
  }

  return { allowed: true };
}