import type { RolCreateData, RolUpdateData } from '../types/rol.types';

export function isCreateRoleFormDirty(form: RolCreateData): boolean {
  return form.nombre.trim() !== '' || (form.descripcion ?? '').trim() !== '';
}

export interface EditRoleFormSnapshot {
  nombre: string;
  descripcion: string;
  es_activo: boolean;
}

export function buildEditRoleFormSnapshot(form: RolUpdateData): EditRoleFormSnapshot {
  return {
    nombre: form.nombre?.trim() ?? '',
    descripcion: form.descripcion?.trim() ?? '',
    es_activo: Boolean(form.es_activo),
  };
}

export function isEditRoleFormDirty(
  form: RolUpdateData,
  snapshot: EditRoleFormSnapshot | null,
): boolean {
  if (!snapshot) return false;
  const current = buildEditRoleFormSnapshot(form);
  return (
    current.nombre !== snapshot.nombre ||
    current.descripcion !== snapshot.descripcion ||
    current.es_activo !== snapshot.es_activo
  );
}
