import { useEffect, useState } from 'react';

import { useEmpresaSelectionStore } from './empresa-selection.store';

/** Espera rehidratación de localStorage antes del bootstrap o redirects. */
export function waitForEmpresaSelectionHydration(): Promise<void> {
  const { persist } = useEmpresaSelectionStore;
  if (persist.hasHydrated()) {
    return Promise.resolve();
  }
  return new Promise((resolve) => {
    const unsub = persist.onFinishHydration(() => {
      unsub();
      resolve();
    });
  });
}

/** Hook: true cuando el store persistido ya rehidrató. */
export function useEmpresaSelectionHydrated(): boolean {
  const [hydrated, setHydrated] = useState(() =>
    useEmpresaSelectionStore.persist.hasHydrated(),
  );

  useEffect(() => {
    if (useEmpresaSelectionStore.persist.hasHydrated()) {
      setHydrated(true);
      return;
    }
    return useEmpresaSelectionStore.persist.onFinishHydration(() => {
      setHydrated(true);
    });
  }, []);

  return hydrated;
}
