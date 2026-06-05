import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import type {
  EmpresaDisponible,
  LoginEmpresaSelectionResponse,
  UserData,
} from '../types/auth.types';

const STORAGE_KEY = 'caxis-empresa-selection-pending';

interface EmpresaSelectionState {
  selectionToken: string | null;
  empresasDisponibles: EmpresaDisponible[];
  userPreview: UserData | null;
  setPendingSelection: (response: LoginEmpresaSelectionResponse) => void;
  clearPendingSelection: () => void;
  hasPendingSelection: () => boolean;
}

export const useEmpresaSelectionStore = create<EmpresaSelectionState>()(
  persist(
    (set, get) => ({
      selectionToken: null,
      empresasDisponibles: [],
      userPreview: null,
      setPendingSelection: (response) =>
        set({
          selectionToken: response.selection_token,
          empresasDisponibles: response.empresas_disponibles ?? [],
          userPreview: response.user_data ?? null,
        }),
      clearPendingSelection: () =>
        set({
          selectionToken: null,
          empresasDisponibles: [],
          userPreview: null,
        }),
      hasPendingSelection: () => {
        const token = get().selectionToken;
        return typeof token === 'string' && token.trim().length > 0;
      },
    }),
    {
      name: STORAGE_KEY,
      partialize: (state) => ({
        selectionToken: state.selectionToken,
        empresasDisponibles: state.empresasDisponibles,
        userPreview: state.userPreview,
      }),
    },
  ),
);
