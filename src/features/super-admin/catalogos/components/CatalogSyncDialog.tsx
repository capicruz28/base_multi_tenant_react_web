import { useEffect, useMemo, useState } from 'react';

import { useQuery } from '@tanstack/react-query';

import { Loader2 } from 'lucide-react';

import { useClientes } from '@/core/hooks/useClientes';

import { conexionService } from '@/features/super-admin/clientes/services/conexion.service';

import { Button } from '@/shared/components/ui/button';

import {

  Dialog,

  DialogBody,

  DialogContent,

  DialogFooter,

  DialogHeader,

  DialogTitle,

} from '@/shared/components/ui/dialog';

import type { CatalogSyncScope } from '../types/platform-catalog-sync.types';

import { DedicatedTenantSelect } from './DedicatedTenantSelect';

import { resolveDedicatedTenantDatabaseName } from '../utils/dedicated-tenant-select.utils';



export type CatalogSyncTargetMode = 'all' | 'single';



export interface CatalogSyncDialogProps {

  isOpen: boolean;

  onClose: () => void;

  catalogTitle: string;

  onConfirm: (scope: CatalogSyncScope) => Promise<void>;

  isLoading?: boolean;

}



/**

 * F14 — Diálogo único de sincronización Platform → Dedicated.

 */

export function CatalogSyncDialog({

  isOpen,

  onClose,

  catalogTitle,

  onConfirm,

  isLoading = false,

}: CatalogSyncDialogProps) {

  const [targetMode, setTargetMode] = useState<CatalogSyncTargetMode>('all');

  const [selectedClienteId, setSelectedClienteId] = useState('');



  const { data: clientesData, isLoading: clientesLoading } = useClientes({

    pagina: 1,

    limite: 500,

    enabled: isOpen,

  });



  const dedicatedClientes = useMemo(

    () =>

      (clientesData?.clientes ?? []).filter(

        (cliente) => cliente.tipo_instalacion === 'dedicated' && cliente.es_activo,

      ),

    [clientesData?.clientes],

  );



  const selectedCliente = useMemo(

    () => dedicatedClientes.find((cliente) => cliente.cliente_id === selectedClienteId) ?? null,

    [dedicatedClientes, selectedClienteId],

  );



  const { data: conexiones, isLoading: conexionesLoading } = useQuery({

    queryKey: ['catalog-sync', 'cliente-conexiones', selectedClienteId],

    queryFn: () => conexionService.getConexiones(selectedClienteId),

    enabled: isOpen && targetMode === 'single' && selectedClienteId.length > 0,

    staleTime: 30_000,

  });



  const selectedDatabaseName = useMemo(() => {

    if (!selectedClienteId) {

      return '—';

    }

    if (conexionesLoading) {

      return 'Cargando…';

    }

    if (!conexiones || conexiones.length === 0) {

      return '—';

    }

    return resolveDedicatedTenantDatabaseName(conexiones);

  }, [selectedClienteId, conexiones, conexionesLoading]);



  useEffect(() => {

    if (!isOpen) {

      setTargetMode('all');

      setSelectedClienteId('');

    }

  }, [isOpen]);



  const canConfirm =

    !isLoading &&

    (targetMode === 'all' || (targetMode === 'single' && selectedClienteId.length > 0));



  const handleConfirm = async () => {

    if (!canConfirm) {

      return;

    }



    try {

      if (targetMode === 'all') {

        await onConfirm({ mode: 'all' });

        return;

      }



      await onConfirm({ mode: 'single', clienteId: selectedClienteId });

    } catch {

      /* toast en onError del hook */

    }

  };



  return (

    <Dialog

      open={isOpen}

      onOpenChange={(open) => {

        if (!open && !isLoading) {

          onClose();

        }

      }}

    >

      <DialogContent className="max-w-lg max-h-[90vh] flex flex-col gap-0 p-0 overflow-y-auto">

        <DialogHeader className="px-6 pt-6 pb-2 flex-shrink-0">

          <DialogTitle>Sincronizar {catalogTitle}</DialogTitle>

        </DialogHeader>



        <DialogBody className="px-6 py-4 space-y-4 overflow-visible">

          <div className="rounded-lg border border-info/30 bg-info/10 p-4 text-sm text-text-base space-y-2">

            <p>

              Esta operación sincronizará el catálogo seleccionado hacia tenants Dedicated.

            </p>

            <p className="text-text-soft">La operación:</p>

            <ul className="list-disc pl-5 text-text-soft space-y-1">

              <li>inserta registros nuevos</li>

              <li>actualiza registros modificados</li>

              <li>desactiva registros obsoletos</li>

            </ul>

            <p className="text-text-soft">No afecta tenants Shared.</p>

          </div>



          <fieldset className="space-y-3" disabled={isLoading}>

            <legend className="text-sm font-medium text-text-base mb-2">Destino</legend>



            <label className="flex items-start gap-3 cursor-pointer select-none">

              <input

                type="radio"

                name="catalog-sync-target"

                checked={targetMode === 'all'}

                onChange={() => setTargetMode('all')}

                className="mt-1 accent-brand-primary"

              />

              <span>

                <span className="block text-sm font-medium text-text-base">

                  Todos los tenants Dedicated

                </span>

                <span className="block text-xs text-text-soft">

                  Sincroniza con todos los clientes Dedicated activos.

                </span>

              </span>

            </label>



            <label className="flex items-start gap-3 cursor-pointer select-none">

              <input

                type="radio"

                name="catalog-sync-target"

                checked={targetMode === 'single'}

                onChange={() => setTargetMode('single')}

                className="mt-1 accent-brand-primary"

              />

              <span>

                <span className="block text-sm font-medium text-text-base">

                  Un tenant Dedicated

                </span>

                <span className="block text-xs text-text-soft">

                  Seleccione un cliente Dedicated específico.

                </span>

              </span>

            </label>

          </fieldset>



          {targetMode === 'single' ? (

            <div className="relative z-50 space-y-3">

              <div>

                <label htmlFor="catalog-sync-cliente" className="block text-sm font-medium text-text-soft mb-1">

                  Tenant Dedicated

                </label>

                <DedicatedTenantSelect

                  id="catalog-sync-cliente"

                  clientes={dedicatedClientes}

                  value={selectedClienteId}

                  onChange={setSelectedClienteId}

                  isLoading={clientesLoading}

                  disabled={isLoading}

                  placeholder="Buscar tenant Dedicated..."

                />

                {!clientesLoading && dedicatedClientes.length === 0 ? (

                  <p className="mt-2 text-xs text-warning">

                    No hay tenants Dedicated activos disponibles.

                  </p>

                ) : null}

              </div>



              {selectedCliente ? (

                <div className="rounded-lg border border-border-base bg-subtle p-3 text-sm space-y-2">

                  <p className="text-xs font-medium uppercase tracking-wide text-text-soft">

                    Resumen del tenant

                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">

                    <div>

                      <p className="text-xs text-text-soft">Código Cliente</p>

                      <p className="text-text-base font-medium">{selectedCliente.codigo_cliente}</p>

                    </div>

                    <div>

                      <p className="text-xs text-text-soft">Base de datos</p>

                      <p className="text-text-base font-medium">{selectedDatabaseName}</p>

                    </div>

                  </div>

                  <div>

                    <p className="text-xs text-text-soft">Razón Social</p>

                    <p className="text-text-base font-medium">{selectedCliente.razon_social}</p>

                  </div>

                </div>

              ) : null}

            </div>

          ) : null}

        </DialogBody>



        <DialogFooter className="px-6 pb-6 pt-2 flex-shrink-0 gap-2">

          <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>

            Cancelar

          </Button>

          <Button

            type="button"

            onClick={() => void handleConfirm()}

            disabled={!canConfirm}

            className="bg-brand-primary hover:bg-brand-primary-hover text-white"

          >

            {isLoading ? (

              <>

                <Loader2 className="h-4 w-4 animate-spin mr-2" aria-hidden />

                Sincronizando…

              </>

            ) : (

              'Sincronizar'

            )}

          </Button>

        </DialogFooter>

      </DialogContent>

    </Dialog>

  );

}


