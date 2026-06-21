// src/shared/context/AuthContext.tsx
import React, {
	createContext,
	useContext,
	ReactNode,
} from 'react';

import type { UserPermissions } from '../../core/auth/types/permission.types';
import type { AuthMenuModulo } from '../../core/auth/types/auth-menu.types';
import type {
	UserData,
	ClienteInfo,
	EmpresaOption,
	AuthLoginSession,
	PasswordChangeRequest,
	Token,
} from '../../features/auth/types/auth.types';
import { useAuthProvider } from '@/core/auth/provider/useAuthProvider';

export type {
	GetTerminateSessionDepsParams,
	AuthTerminationToastApi,
	LegacySessionLogoutDeps,
	RunSessionTerminationExitOptions,
	GetLogoutAllFlowDepsParams,
	SessionValidityProbeDeps,
	GetSessionValidityProbeDepsParams,
	ExecuteClassifiedTerminationOptions,
	HydrateFetchMeErrorRef,
	CreateTerminateFromHydrateFailureOptions,
} from '@/core/auth/provider/auth-provider-termination.helpers';

export {
	AUTH_REFRESH_TERMINATION_URL,
	LEGACY_SESSION_QUEUE_ERROR_MESSAGE,
	getTerminateSessionDeps,
	createAuthTerminateRedirectToLogin,
	createAuthShowTerminationToast,
	performLegacySessionLogout,
	buildTerminationClearQueryCache,
	runSessionTerminationExit,
	extractTerminationHttpContextFromError,
	buildBootstrapTerminationClassifyInput,
	buildInterceptorRefreshTerminationClassifyInput,
	buildTerminateSessionInput,
	buildDoLogoutTerminateInput,
	executeDoLogoutTermination,
	buildLogoutAllTerminateInput,
	getLogoutAllFlowDeps,
	executeLogoutAllTermination,
	getSessionValidityProbeDeps,
	runSessionValidityProbe,
	buildInterceptorTerminationClassifyInput,
	executeClassifiedTermination,
	executeBootstrapRefreshTermination,
	executeInterceptorRefreshTermination,
	buildHydrateFailureClassifyInput,
	executeHydrateFailureTermination,
	createHydrateFetchMeWithErrorCapture,
	createTerminateFromHydrateFailure,
} from '@/core/auth/provider/auth-provider-termination.helpers';

// ============================================================================
// TIPOS
// ============================================================================
type AuthState = {
	user: UserData | null;
	token: string | null;
};

interface AuthContextType {
	auth: AuthState;
	setAuthFromLogin: (response: Token) => Promise<AuthLoginSession | null>;
	completeEmpresaSelection: (empresaId: string) => Promise<UserData | null>;
	cambiarEmpresaActiva: (empresaId: string) => Promise<UserData | null>;
	logout: () => Promise<void>;
	/** POST /auth/logout_all/ + terminación local (IAM-FE-PHASE-03 IMPL-04). */
	logoutAllSessions: () => Promise<void>;
	/** GET /auth/me probe sin mutar estado (IAM-FE-PHASE-03 IMPL-05). */
	runSessionValidityProbe: () => Promise<void>;
	isAuthenticated: boolean;
	loading: boolean;
	authInitialized: boolean;
	isBootstrapped: boolean;
	hasRole: (...roles: string[]) => boolean;
	accessLevel: number;
	isSuperAdmin: boolean;
	userType: string;
	clienteInfo: ClienteInfo | null;
	permissions: UserPermissions | null;
	menuModulos: AuthMenuModulo[] | null;
	/** true cuando GET /auth/menu terminó y permisos de ruta están listos para PermissionGuard */
	menuPermissionsReady: boolean;
	empresaActivaId: string | null;
	empresasElegibles: EmpresaOption[];
	/** @deprecated Alias de empresasElegibles */
	empresasDisponibles: EmpresaOption[];
	requiereSeleccionEmpresa: boolean;
	esAdminCliente: boolean;
	hasEmpresaActivaFlag: boolean;
	canAccessErp: boolean;
	mustSelectEmpresa: boolean;
	reloadMenuAndPermissions: () => Promise<void>;
	isImpersonation: boolean;
	impersonatedBy: string | null;
	impersonatedByUsername: string | null;
	impersonationClienteLabel: string | null;
	startImpersonation: (
		clienteId: string,
		options?: { clienteLabel?: string },
	) => Promise<{ requiresEmpresaSelection: boolean }>;
	endImpersonation: () => Promise<void>;
	/** Cambio obligatorio antes de ERP (derivado de user / selection preview). */
	requiresPasswordChange: boolean;
	completePasswordChange: (payload: PasswordChangeRequest) => Promise<AuthLoginSession | null>;
}

// ============================================================================
// CONSTANTES
// ============================================================================
const initialAuth: AuthState = { user: null, token: null };

const AuthContext = createContext<AuthContextType>({
	auth: initialAuth,
	setAuthFromLogin: async () => null as AuthLoginSession | null,
	completeEmpresaSelection: async () => null,
	cambiarEmpresaActiva: async () => null,
	logout: async () => {},
	logoutAllSessions: async () => {},
	runSessionValidityProbe: async () => {},
	isAuthenticated: false,
	loading: true,
	authInitialized: false,
	isBootstrapped: false,
	hasRole: () => false,
	accessLevel: 0,
	isSuperAdmin: false,
	userType: 'user',
	clienteInfo: null,
	permissions: null,
	menuModulos: null,
	menuPermissionsReady: false,
	empresaActivaId: null,
	empresasElegibles: [],
	empresasDisponibles: [],
	requiereSeleccionEmpresa: false,
	esAdminCliente: false,
	hasEmpresaActivaFlag: false,
	canAccessErp: false,
	mustSelectEmpresa: false,
	reloadMenuAndPermissions: async () => {},
	isImpersonation: false,
	impersonatedBy: null,
	impersonatedByUsername: null,
	impersonationClienteLabel: null,
	startImpersonation: async () => ({ requiresEmpresaSelection: false }),
	endImpersonation: async () => {},
	requiresPasswordChange: false,
	completePasswordChange: async () => null,
});

// ============================================================================
// PROVIDER
// ============================================================================
export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
	const { contextValue, renderProviderTree } = useAuthProvider();

	return (
		<AuthContext.Provider value={contextValue}>
			{renderProviderTree(children)}
		</AuthContext.Provider>
	);
};

// ============================================================================
// HOOK
// ============================================================================
export const useAuth = () => {
	const context = useContext(AuthContext);
	if (!context) {
		throw new Error('useAuth must be used within AuthProvider');
	}
	return context;
};
