import type { Dispatch, SetStateAction } from 'react';

export interface MovimientosListUiSetters {
  setDetailOpen: Dispatch<SetStateAction<boolean>>;
  setSelectedMovimientoId: Dispatch<SetStateAction<string | null>>;
  setAutorizarOpen: Dispatch<SetStateAction<boolean>>;
  setProcesarOpen: Dispatch<SetStateAction<boolean>>;
  setAnularOpen: Dispatch<SetStateAction<boolean>>;
  setAnularMotivo: Dispatch<SetStateAction<string>>;
}

export interface InventarioFisicoListUiSetters {
  setDetailOpen: Dispatch<SetStateAction<boolean>>;
  setSelectedId: Dispatch<SetStateAction<string | null>>;
  setAprobarOpen: Dispatch<SetStateAction<boolean>>;
  setAprobarTipoMovimientoId: Dispatch<SetStateAction<string>>;
  setAprobarObs: Dispatch<SetStateAction<string>>;
  setAnularOpen: Dispatch<SetStateAction<boolean>>;
  setFinalizarOpen: Dispatch<SetStateAction<boolean>>;
}

/** INV-M2-SEC O6 — cierra modals, confirms workflow y selección al cambiar empresa. */
export function resetMovimientosListUiState(s: MovimientosListUiSetters): void {
  s.setDetailOpen(false);
  s.setSelectedMovimientoId(null);
  s.setAutorizarOpen(false);
  s.setProcesarOpen(false);
  s.setAnularOpen(false);
  s.setAnularMotivo('');
}

export function resetInventarioFisicoListUiState(s: InventarioFisicoListUiSetters): void {
  s.setDetailOpen(false);
  s.setSelectedId(null);
  s.setAprobarOpen(false);
  s.setAprobarTipoMovimientoId('');
  s.setAprobarObs('');
  s.setAnularOpen(false);
  s.setFinalizarOpen(false);
}
