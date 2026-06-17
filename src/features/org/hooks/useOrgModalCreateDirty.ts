import { useCallback, useState } from 'react';
import { isDirtyAgainstBaseline } from '../utils/org-form-dirty.helpers';

export interface UseOrgModalCreateDirtyOptions<TForm, TSnapshot> {
  normalize: (form: TForm) => TSnapshot;
  getInitialForm: () => TForm;
}

/**
 * Baseline de dirty create sincronizado al abrir el modal.
 * Evita falsos positivos cuando el formulario inicial incluye defaults o prefills automáticos.
 */
export function useOrgModalCreateDirty<TForm, TSnapshot>({
  normalize,
  getInitialForm,
}: UseOrgModalCreateDirtyOptions<TForm, TSnapshot>) {
  const [createBaseline, setCreateBaseline] = useState<TSnapshot>(() =>
    normalize(getInitialForm()),
  );

  const syncCreateBaseline = useCallback(
    (form: TForm) => {
      setCreateBaseline(normalize(form));
    },
    [normalize],
  );

  const isCreateDirty = useCallback(
    (form: TForm) => isDirtyAgainstBaseline(normalize(form), createBaseline),
    [normalize, createBaseline],
  );

  return { createBaseline, syncCreateBaseline, isCreateDirty };
}
