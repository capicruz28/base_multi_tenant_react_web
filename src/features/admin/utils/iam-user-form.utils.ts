import type { UserFormData, UserUpdateData } from '../types/usuario.types';

export function isCreateUserFormDirty(form: UserFormData, selectedRoleIds: string[]): boolean {
  return (
    form.nombre_usuario.trim() !== '' ||
    form.correo.trim() !== '' ||
    (form.contrasena ?? '').length > 0 ||
    (form.nombre ?? '').trim() !== '' ||
    (form.apellido ?? '').trim() !== '' ||
    selectedRoleIds.length > 0
  );
}

export interface EditUserFormSnapshot {
  correo: string;
  nombre: string;
  apellido: string;
  es_activo: boolean;
  roleIds: string[];
}

export function buildEditUserFormSnapshot(
  form: UserUpdateData,
  roleIds: string[],
): EditUserFormSnapshot {
  return {
    correo: form.correo?.trim() ?? '',
    nombre: form.nombre?.trim() ?? '',
    apellido: form.apellido?.trim() ?? '',
    es_activo: Boolean(form.es_activo),
    roleIds: [...roleIds].sort(),
  };
}

function sortedRoleIds(ids: string[]): string[] {
  return [...ids].sort();
}

function roleIdsEqual(a: string[], b: string[]): boolean {
  const left = sortedRoleIds(a);
  const right = sortedRoleIds(b);
  return left.length === right.length && left.every((id, index) => id === right[index]);
}

export function isEditUserFormDirty(
  form: UserUpdateData,
  selectedRoleIds: string[],
  snapshot: EditUserFormSnapshot | null,
): boolean {
  if (!snapshot) return false;

  const current = buildEditUserFormSnapshot(form, selectedRoleIds);
  return (
    current.correo !== snapshot.correo ||
    current.nombre !== snapshot.nombre ||
    current.apellido !== snapshot.apellido ||
    current.es_activo !== snapshot.es_activo ||
    !roleIdsEqual(current.roleIds, snapshot.roleIds)
  );
}
