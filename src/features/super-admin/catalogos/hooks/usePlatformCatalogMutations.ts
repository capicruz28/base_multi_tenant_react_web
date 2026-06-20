/**
 * FA-001 — Mutaciones CRUD catálogo global (create / update / deactivate / reactivate).
 * Scope Freeze §6.5, §7.2 — invalidate listPrefix; toast solo en onError.
 */
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import type {
  CatDepartamentoUpdate,
  CatDistritoUpdate,
  CatMonedaUpdate,
  CatPaisUpdate,
  CatProvinciaUpdate,
} from '@/types/catalogos.types';
import { getErrorMessage } from '@/core/services/error.service';
import { platformCatalogListPrefixKey } from './platform-catalog-query-keys';
import { platformCatalogGlobalService } from '../services/platform-catalog-global.service';
import type {
  PlatformCatalogCreateByEntityId,
  PlatformCatalogEntityId,
  PlatformCatalogItemByEntityId,
} from '../types/platform-catalog.types';

type PlatformCatalogUpdateByEntityId = {
  moneda: CatMonedaUpdate;
  pais: CatPaisUpdate;
  departamento: CatDepartamentoUpdate;
  provincia: CatProvinciaUpdate;
  distrito: CatDistritoUpdate;
};

interface EntityMutationHandlers<E extends PlatformCatalogEntityId> {
  create: (payload: PlatformCatalogCreateByEntityId[E]) => Promise<PlatformCatalogItemByEntityId[E]>;
  update: (
    id: string,
    payload: PlatformCatalogUpdateByEntityId[E],
  ) => Promise<PlatformCatalogItemByEntityId[E]>;
  delete: (id: string) => Promise<void>;
}

const ENTITY_MUTATIONS: {
  [K in PlatformCatalogEntityId]: EntityMutationHandlers<K>;
} = {
  moneda: {
    create: (payload) => platformCatalogGlobalService.createMoneda(payload),
    update: (id, payload) => platformCatalogGlobalService.updateMoneda(id, payload),
    delete: (id) => platformCatalogGlobalService.deleteMoneda(id),
  },
  pais: {
    create: (payload) => platformCatalogGlobalService.createPais(payload),
    update: (id, payload) => platformCatalogGlobalService.updatePais(id, payload),
    delete: (id) => platformCatalogGlobalService.deletePais(id),
  },
  departamento: {
    create: (payload) => platformCatalogGlobalService.createDepartamento(payload),
    update: (id, payload) => platformCatalogGlobalService.updateDepartamento(id, payload),
    delete: (id) => platformCatalogGlobalService.deleteDepartamento(id),
  },
  provincia: {
    create: (payload) => platformCatalogGlobalService.createProvincia(payload),
    update: (id, payload) => platformCatalogGlobalService.updateProvincia(id, payload),
    delete: (id) => platformCatalogGlobalService.deleteProvincia(id),
  },
  distrito: {
    create: (payload) => platformCatalogGlobalService.createDistrito(payload),
    update: (id, payload) => platformCatalogGlobalService.updateDistrito(id, payload),
    delete: (id) => platformCatalogGlobalService.deleteDistrito(id),
  },
};

const CREATE_SUCCESS: Record<PlatformCatalogEntityId, string> = {
  moneda: 'Moneda creada.',
  pais: 'País creado.',
  departamento: 'Departamento creado.',
  provincia: 'Provincia creada.',
  distrito: 'Distrito creado.',
};

const UPDATE_SUCCESS: Record<PlatformCatalogEntityId, string> = {
  moneda: 'Moneda actualizada.',
  pais: 'País actualizado.',
  departamento: 'Departamento actualizado.',
  provincia: 'Provincia actualizada.',
  distrito: 'Distrito actualizado.',
};

const DEACTIVATE_SUCCESS: Record<PlatformCatalogEntityId, string> = {
  moneda: 'Moneda desactivada.',
  pais: 'País desactivado.',
  departamento: 'Departamento desactivado.',
  provincia: 'Provincia desactivada.',
  distrito: 'Distrito desactivado.',
};

const REACTIVATE_SUCCESS: Record<PlatformCatalogEntityId, string> = {
  moneda: 'Moneda reactivada.',
  pais: 'País reactivado.',
  departamento: 'Departamento reactivado.',
  provincia: 'Provincia reactivada.',
  distrito: 'Distrito reactivado.',
};

export function usePlatformCatalogMutations<E extends PlatformCatalogEntityId>(entityId: E) {
  const queryClient = useQueryClient();
  const handlers = ENTITY_MUTATIONS[entityId];

  const invalidateList = () => {
    void queryClient.invalidateQueries({
      queryKey: platformCatalogListPrefixKey(entityId),
    });
  };

  const createMutation = useMutation<
    PlatformCatalogItemByEntityId[E],
    Error,
    PlatformCatalogCreateByEntityId[E]
  >({
    mutationFn: (payload) => handlers.create(payload),
    retry: 0,
    onSuccess: () => {
      invalidateList();
      toast.success(CREATE_SUCCESS[entityId]);
    },
    onError: (err) => toast.error(getErrorMessage(err).message),
  });

  const updateMutation = useMutation<
    PlatformCatalogItemByEntityId[E],
    Error,
    { id: string; payload: PlatformCatalogUpdateByEntityId[E] }
  >({
    mutationFn: ({ id, payload }) => handlers.update(id, payload),
    retry: 0,
    onSuccess: () => {
      invalidateList();
      toast.success(UPDATE_SUCCESS[entityId]);
    },
    onError: (err) => toast.error(getErrorMessage(err).message),
  });

  const deactivateMutation = useMutation<void, Error, string>({
    mutationFn: (id) => handlers.delete(id),
    retry: 0,
    onSuccess: () => {
      invalidateList();
      toast.success(DEACTIVATE_SUCCESS[entityId]);
    },
    onError: (err) => toast.error(getErrorMessage(err).message),
  });

  const reactivateMutation = useMutation<
    PlatformCatalogItemByEntityId[E],
    Error,
    string
  >({
    mutationFn: (id) =>
      handlers.update(id, { es_activo: true } as PlatformCatalogUpdateByEntityId[E]),
    retry: 0,
    onSuccess: () => {
      invalidateList();
      toast.success(REACTIVATE_SUCCESS[entityId]);
    },
    onError: (err) => toast.error(getErrorMessage(err).message),
  });

  return {
    create: createMutation.mutateAsync,
    update: updateMutation.mutateAsync,
    deactivate: deactivateMutation.mutateAsync,
    reactivate: reactivateMutation.mutateAsync,
    createMutation,
    updateMutation,
    deactivateMutation,
    reactivateMutation,
    isAnyPending:
      createMutation.isPending ||
      updateMutation.isPending ||
      deactivateMutation.isPending ||
      reactivateMutation.isPending,
  };
}
