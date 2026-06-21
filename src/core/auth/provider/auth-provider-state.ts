/**
 * IAM-FE-PHASE-09 IMPL-06 — State bundle + ref sync E1–E3 (copy-first monolito L332–386).
 * hydrateFetchMeErrorRef NO incluido — declaración tardía L1043 (IMPL-01 §5).
 */
import { useEffect, useRef, useState } from 'react';

import type { AuthMenuModulo } from '@/core/auth/types/auth-menu.types';
import type { UserPermissions } from '@/core/auth/types/permission.types';
import type {
	AuthProviderAuthState,
	AuthProviderFailedQueueEntry,
	AuthProviderRefs,
	AuthProviderSetters,
	AuthProviderState,
} from '@/core/auth/provider/auth-provider.types';
import type { SessionTerminationCaller } from '@/core/auth/session/session-telemetry.types';
import type { ClienteInfo, EmpresaOption } from '@/features/auth/types/auth.types';

export const AUTH_PROVIDER_INITIAL_AUTH: AuthProviderAuthState = {
	user: null,
	token: null,
};

/** Refs tempranos del monolito — sin hydrateFetchMeErrorRef (tardío). */
export type AuthProviderEarlyRefs = Omit<AuthProviderRefs, 'hydrateFetchMeErrorRef'>;

export interface AuthProviderStateBundle {
	readonly state: AuthProviderState;
	readonly setters: AuthProviderSetters;
	readonly refs: AuthProviderEarlyRefs;
}

export function useAuthProviderState(): AuthProviderStateBundle {
	const [auth, setAuth] = useState<AuthProviderAuthState>(AUTH_PROVIDER_INITIAL_AUTH);
	const [loading, setLoading] = useState(true);
	const [authInitialized, setAuthInitialized] = useState(false);
	const [isBootstrapped, setIsBootstrapped] = useState(false);

	// ✅ Estados para información de niveles de acceso
	const [accessLevel, setAccessLevel] = useState<number>(0);
	const [isSuperAdmin, setIsSuperAdmin] = useState<boolean>(false);
	const [userType, setUserType] = useState<string>('user');
	const [clienteInfo, setClienteInfo] = useState<ClienteInfo | null>(null);
	// ✅ Estado para permisos granulares (derivados desde /auth/menu)
	const [permissions, setPermissions] = useState<UserPermissions | null>(null);
	// ✅ Estado para menú del usuario (desde GET /auth/menu)
	const [menuModulos, setMenuModulos] = useState<AuthMenuModulo[] | null>(null);
	const [menuPermissionsReady, setMenuPermissionsReady] = useState(false);
	const sessionMenuSnapshotRef = useRef<AuthMenuModulo[] | null>(null);
	const [empresaActivaId, setEmpresaActivaId] = useState<string | null>(null);
	const [empresasElegibles, setEmpresasElegibles] = useState<EmpresaOption[]>([]);
	const [requiereSeleccionEmpresa, setRequiereSeleccionEmpresa] = useState(false);
	const [esAdminCliente, setEsAdminCliente] = useState(false);
	const [isImpersonation, setIsImpersonation] = useState(false);
	const [impersonatedBy, setImpersonatedBy] = useState<string | null>(null);
	const [impersonatedByUsername, setImpersonatedByUsername] = useState<string | null>(null);
	const [impersonationClienteLabel, setImpersonationClienteLabel] = useState<string | null>(
		null,
	);

	// Refs para acceder al estado más reciente sin re-renders
	const authRef = useRef(auth);
	const loadingRef = useRef(loading);
	const empresaActivaIdRef = useRef(empresaActivaId);
	const isInitializedRef = useRef(false);

	const failedQueueRef = useRef<AuthProviderFailedQueueEntry[]>([]);
	const isTerminatingRef = useRef(false);
	const isLogoutAllInFlightRef = useRef(false);
	const isSessionValidityProbeInFlightRef = useRef(false);
	const terminationCallerHintRef = useRef<SessionTerminationCaller | undefined>(undefined);

	// Sincronizar refs — E1, E2, E3 (monolito L376–386)
	useEffect(() => {
		authRef.current = auth;
	}, [auth]);

	useEffect(() => {
		loadingRef.current = loading;
	}, [loading]);

	useEffect(() => {
		empresaActivaIdRef.current = empresaActivaId;
	}, [empresaActivaId]);

	return {
		state: {
			auth,
			loading,
			authInitialized,
			isBootstrapped,
			accessLevel,
			isSuperAdmin,
			userType,
			clienteInfo,
			permissions,
			menuModulos,
			menuPermissionsReady,
			empresaActivaId,
			empresasElegibles,
			requiereSeleccionEmpresa,
			esAdminCliente,
			isImpersonation,
			impersonatedBy,
			impersonatedByUsername,
			impersonationClienteLabel,
		},
		setters: {
			setAuth,
			setLoading,
			setAuthInitialized,
			setIsBootstrapped,
			setAccessLevel,
			setIsSuperAdmin,
			setUserType,
			setClienteInfo,
			setPermissions,
			setMenuModulos,
			setMenuPermissionsReady,
			setEmpresaActivaId,
			setEmpresasElegibles,
			setRequiereSeleccionEmpresa,
			setEsAdminCliente,
			setIsImpersonation,
			setImpersonatedBy,
			setImpersonatedByUsername,
			setImpersonationClienteLabel,
		},
		refs: {
			authRef,
			loadingRef,
			empresaActivaIdRef,
			isInitializedRef,
			failedQueueRef,
			isTerminatingRef,
			isLogoutAllInFlightRef,
			isSessionValidityProbeInFlightRef,
			terminationCallerHintRef,
			sessionMenuSnapshotRef,
		},
	};
}
