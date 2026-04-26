import type { MemberRole } from '@/types';

export function expectedIdLength(role: MemberRole): 7 | 9 {
  return role === 'employee' ? 7 : 9;
}

export function isValidId(id: string, role: MemberRole): boolean {
  const len = expectedIdLength(role);
  return id.length === len && /^\d+$/.test(id);
}

export function isValidIdAnyRole(id: string): boolean {
  return /^\d{7}$/.test(id) || /^\d{9}$/.test(id);
}

export function inferRoleFromId(id: string): MemberRole | null {
  if (/^\d{7}$/.test(id)) return 'employee';
  if (/^\d{9}$/.test(id)) return 'student';
  return null;
}
