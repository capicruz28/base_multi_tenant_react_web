import type { ClienteInfo, EmpresaOption, UserData } from '@/features/auth/types/auth.types';
import {
  findEmpresaById,
  isSameEmpresaId,
  resolveEmpresaLabel,
} from '@/core/auth/utils/empresa-eligibles';

export interface AccountProfileViewModel {
  fullName: string | null;
  username: string | null;
  email: string | null;
  accountStatus: { label: string; active: boolean } | null;
  clientName: string | null;
  activeCompanyName: string | null;
  companyCode: string | null;
  tenantName: string | null;
  primaryRole: string | null;
  roles: string[];
  accessLevel: number | null;
  authTypeLabel: string | null;
}

export interface BuildAccountProfileViewModelInput {
  user: UserData | null;
  clienteInfo: ClienteInfo | null;
  accessLevel: number;
  empresaActivaId: string | null;
  empresasElegibles: EmpresaOption[];
}

function readOptionalString(source: Record<string, unknown>, key: string): string | null {
  const value = source[key];
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function resolveFullName(user: UserData): string | null {
  const full = `${user.nombre?.trim() ?? ''} ${user.apellido?.trim() ?? ''}`.trim();
  return full.length > 0 ? full : null;
}

function resolveClientNames(
  user: UserData,
  clienteInfo: ClienteInfo | null,
): { clientName: string | null; tenantName: string | null } {
  const cliente = clienteInfo ?? user.cliente ?? null;
  if (!cliente) {
    return { clientName: null, tenantName: null };
  }

  const razon = cliente.razon_social?.trim() || null;
  const comercial = cliente.nombre_comercial?.trim() || null;

  if (razon && comercial && razon !== comercial) {
    return { clientName: razon, tenantName: comercial };
  }

  return { clientName: razon ?? comercial, tenantName: null };
}

function resolveActiveCompanyName(
  empresaActivaId: string | null,
  empresasElegibles: EmpresaOption[],
): string | null {
  if (!empresaActivaId) return null;
  const match = findEmpresaById(empresasElegibles, empresaActivaId);
  if (!match) return null;
  const label = resolveEmpresaLabel(match).trim();
  return label.length > 0 ? label : null;
}

function resolveCompanyCode(
  user: UserData,
  empresaActivaId: string | null,
): string | null {
  const rawList = user.empresas_disponibles;
  if (!Array.isArray(rawList) || !empresaActivaId) return null;

  for (const item of rawList) {
    if (!item || typeof item !== 'object') continue;
    const record = item as EmpresaOption & Record<string, unknown>;
    if (!isSameEmpresaId(String(record.empresa_id ?? ''), empresaActivaId)) continue;
    return readOptionalString(record, 'codigo_empresa') ?? readOptionalString(record, 'codigo');
  }

  return null;
}

function resolveAuthTypeLabel(user: UserData): string | null {
  const record = user as UserData & Record<string, unknown>;
  return (
    readOptionalString(record, 'proveedor_autenticacion') ??
    readOptionalString(record, 'tipo_autenticacion')
  );
}

function normalizeRoles(roles: string[] | undefined): string[] {
  if (!Array.isArray(roles)) return [];
  return roles.map((role) => role.trim()).filter((role) => role.length > 0);
}

export function buildAccountProfileViewModel(
  input: BuildAccountProfileViewModelInput,
): AccountProfileViewModel | null {
  const { user, clienteInfo, accessLevel, empresaActivaId, empresasElegibles } = input;
  if (!user) return null;

  const { clientName, tenantName } = resolveClientNames(user, clienteInfo);
  const roles = normalizeRoles(user.roles);

  return {
    fullName: resolveFullName(user),
    username: user.nombre_usuario?.trim() || null,
    email: user.correo?.trim() || null,
    accountStatus: {
      label: user.es_activo ? 'Activa' : 'Inactiva',
      active: user.es_activo,
    },
    clientName,
    activeCompanyName: resolveActiveCompanyName(empresaActivaId, empresasElegibles),
    companyCode: resolveCompanyCode(user, empresaActivaId),
    tenantName,
    primaryRole: roles[0] ?? null,
    roles,
    accessLevel: typeof accessLevel === 'number' ? accessLevel : null,
    authTypeLabel: resolveAuthTypeLabel(user),
  };
}

export function formatAccountAccessLevel(level: number): string {
  return String(level);
}
