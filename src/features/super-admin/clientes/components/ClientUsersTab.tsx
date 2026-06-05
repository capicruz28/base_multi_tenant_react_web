import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import {
  Users,
  Search,
  Filter,
  Loader,
  UserCircle2,
  Mail,
  Shield,
  Activity,
  Calendar,
  Globe,
} from 'lucide-react';
import { useDebounce } from '@/core/utils/debounce';
import { getErrorMessage } from '@/core/services/error.service';
import { superadminUsuarioService } from '@/services/superadmin-usuario.service';
import {
  PaginatedSuperadminUsuariosResponse,
  SuperadminUsuario,
  UsuarioActividadResponse,
  UsuarioSesionesResponse,
} from '@/types/superadmin-usuario.types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/shared/components/ui/dialog';

interface ClientUsersTabProps {
  clienteId: string;
}

const PAGE_SIZE = 10;

const ClientUsersTab: React.FC<ClientUsersTabProps> = ({ clienteId }) => {
  const [data, setData] = useState<PaginatedSuperadminUsuariosResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [page, setPage] = useState<number>(1);
  const [search, setSearch] = useState<string>('');
  const debouncedSearch = useDebounce(search, 400);
  const [estadoFilter, setEstadoFilter] = useState<'all' | 'active' | 'inactive'>('all');

  const [selectedUser, setSelectedUser] = useState<SuperadminUsuario | null>(null);
  const [detalleLoading, setDetalleLoading] = useState<boolean>(false);
  const [actividad, setActividad] = useState<UsuarioActividadResponse | null>(null);
  const [sesiones, setSesiones] = useState<UsuarioSesionesResponse | null>(null);

  const fetchUsuarios = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const es_activo =
        estadoFilter === 'all' ? undefined : estadoFilter === 'active' ? true : false;

      const response = await superadminUsuarioService.getUsuariosByCliente(clienteId, {
        page,
        limit: PAGE_SIZE,
        search: debouncedSearch || undefined,
        es_activo,
      });

      setData(response);
    } catch (err) {
      console.error('Error fetching client users:', err);
      const errorData = getErrorMessage(err);
      setError(errorData.message || 'Error al cargar los usuarios del cliente');
      toast.error(errorData.message || 'Error al cargar los usuarios del cliente');
    } finally {
      setLoading(false);
    }
  }, [clienteId, page, debouncedSearch, estadoFilter]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, estadoFilter, clienteId]);

  useEffect(() => {
    fetchUsuarios();
  }, [fetchUsuarios]);

  const handleOpenDetalle = async (usuario: SuperadminUsuario) => {
    setSelectedUser(usuario);
    setActividad(null);
    setSesiones(null);
    setDetalleLoading(true);

    try {
      const [actividadResp, sesionesResp] = await Promise.all([
        superadminUsuarioService.getUsuarioActividad(usuario.usuario_id, { limite: 20 }, clienteId),
        superadminUsuarioService.getUsuarioSesiones(usuario.usuario_id, { solo_activas: true }, clienteId),
      ]);

      setActividad(actividadResp);
      setSesiones(sesionesResp);
    } catch (err) {
      const errorData = getErrorMessage(err);
      toast.error(errorData.message || 'Error al cargar el detalle del usuario');
    } finally {
      setDetalleLoading(false);
    }
  };

  const handleCloseDetalle = () => {
    setSelectedUser(null);
    setActividad(null);
    setSesiones(null);
  };

  const totalUsuarios = data?.total_usuarios ?? 0;
  const totalPaginas = data?.total_paginas ?? 1;

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader className="animate-spin h-8 w-8 text-brand-primary" />
        <span className="ml-3 text-text-soft">
          Cargando usuarios del cliente...
        </span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-center">
        <div className="text-error bg-error/10 p-4 rounded-lg">
          {error}
        </div>
        <button
          onClick={fetchUsuarios}
          className="mt-4 px-4 py-2 bg-brand-primary text-white rounded-lg hover:bg-brand-primary-hover transition-colors"
        >
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Resumen */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-surface rounded-lg shadow-sm border border-border-base p-4">
          <div className="flex items-center">
            <Users className="h-8 w-8 text-brand-primary" />
            <div className="ml-4">
              <p className="text-sm font-medium text-text-soft">
                Usuarios totales
              </p>
              <p className="text-2xl font-semibold text-text-base">
                {totalUsuarios}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-surface rounded-lg shadow-sm border border-border-base p-4">
          <div className="flex items-center">
            <Activity className="h-8 w-8 text-success" />
            <div className="ml-4">
              <p className="text-sm font-medium text-text-soft">
                Activos
              </p>
              <p className="text-2xl font-semibold text-text-base">
                {data?.usuarios.filter((u) => u.es_activo).length ?? 0}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-surface rounded-lg shadow-sm border border-border-base p-4">
          <div className="flex items-center">
            <Shield className="h-8 w-8 text-info" />
            <div className="ml-4">
              <p className="text-sm font-medium text-text-soft">
                Roles distintos (muestra página actual)
              </p>
              <p className="text-2xl font-semibold text-text-base">
                {new Set(
                  (data?.usuarios ?? []).flatMap((u) => u.roles.map((r) => r.nombre)),
                ).size}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-surface rounded-lg shadow-sm border border-border-base p-4">
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
          <div className="flex-1 flex gap-2">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-text-soft" />
              <input
                type="text"
                placeholder="Buscar por nombre, usuario o email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 pr-4 py-2 w-full border border-border-base rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-brand-primary bg-surface dark:bg-subtle dark:text-text-base"
              />
            </div>
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-text-soft" />
              <select
                value={estadoFilter}
                onChange={(e) => setEstadoFilter(e.target.value as any)}
                className="pl-10 pr-8 py-2 border border-border-base rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-brand-primary bg-surface dark:bg-subtle dark:text-text-base"
              >
                <option value="all">Todos</option>
                <option value="active">Solo activos</option>
                <option value="inactive">Solo inactivos</option>
              </select>
            </div>
          </div>

          {loading && (
            <div className="flex items-center text-sm text-text-soft">
              <Loader className="h-4 w-4 animate-spin mr-2" />
              Actualizando...
            </div>
          )}
        </div>
      </div>

      {/* Tabla */}
      <div className="bg-surface rounded-lg shadow-sm border border-border-base overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-border-base">
            <thead className="bg-subtle">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-text-soft uppercase tracking-wider">
                  Usuario
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-text-soft uppercase tracking-wider">
                  Email / Cliente
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-text-soft uppercase tracking-wider">
                  Roles
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-text-soft uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-text-soft uppercase tracking-wider">
                  Último acceso
                </th>
              </tr>
            </thead>
            <tbody className="bg-surface divide-y divide-border-base">
              {data && data.usuarios.length > 0 ? (
                data.usuarios.map((usuario) => (
                  <tr
                    key={usuario.usuario_id}
                    className="hover:bg-overlay/50 dark:hover:bg-overlay/50 cursor-pointer"
                    onClick={() => handleOpenDetalle(usuario)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 rounded-full bg-brand-primary/10 dark:bg-brand-primary/20 flex items-center justify-center">
                          <UserCircle2 className="h-6 w-6 text-brand-primary" />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-text-base">
                            {usuario.nombre || usuario.apellido
                              ? `${usuario.nombre ?? ''} ${usuario.apellido ?? ''}`.trim()
                              : usuario.nombre_usuario}
                          </div>
                          <div className="text-xs text-text-soft">
                            {usuario.nombre_usuario}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-text-base flex items-center gap-2">
                        <Mail className="h-3 w-3 text-text-soft" />
                        <span>{usuario.correo || 'Sin correo'}</span>
                      </div>
                      <div className="text-xs text-text-soft flex items-center gap-1 mt-1">
                        <Globe className="h-3 w-3" />
                        <span>{usuario.cliente.subdominio}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-text-soft">
                      {usuario.roles.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {usuario.roles.map((rol) => (
                            <span
                              key={rol.rol_id}
                              className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-subtle text-text-base"
                            >
                              {rol.nombre}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-xs text-text-soft">Sin roles</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col gap-1">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            usuario.es_activo
                              ? 'bg-success/10 text-success'
                              : 'bg-error/10 text-error'
                          }`}
                        >
                          {usuario.es_activo ? 'Activo' : 'Inactivo'}
                        </span>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-info/10 text-info">
                          {usuario.proveedor_autenticacion}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-text-soft">
                      {usuario.fecha_ultimo_acceso ? (
                        <div>
                          <div>
                            {new Date(usuario.fecha_ultimo_acceso).toLocaleDateString()}
                          </div>
                          <div className="text-xs">
                            {new Date(usuario.fecha_ultimo_acceso).toLocaleTimeString()}
                          </div>
                        </div>
                      ) : (
                        <span className="text-text-soft text-xs">Nunca</span>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-10 text-center text-sm text-text-soft"
                  >
                    <Users className="mx-auto h-12 w-12 text-text-soft mb-4" />
                    {search || estadoFilter !== 'all' ? (
                      <>
                        <p>No se encontraron usuarios con los filtros aplicados.</p>
                        <p className="mt-1 text-xs">
                          Ajusta la búsqueda o el estado para ver más resultados.
                        </p>
                      </>
                    ) : (
                      <>
                        <p>Este cliente aún no tiene usuarios registrados o visibles.</p>
                      </>
                    )}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Paginación */}
        {data && totalUsuarios > PAGE_SIZE && (
          <div className="px-6 py-4 border-t border-border-base bg-subtle">
            <div className="flex items-center justify-between">
              <div className="text-sm text-text-base">
                Mostrando{' '}
                <span className="font-medium">{(page - 1) * PAGE_SIZE + 1}</span> a{' '}
                <span className="font-medium">
                  {Math.min(page * PAGE_SIZE, totalUsuarios)}
                </span>{' '}
                de <span className="font-medium">{totalUsuarios}</span> usuarios
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                  disabled={page === 1}
                  className="px-3 py-1 text-sm border border-border-base rounded-md bg-surface text-text-soft hover:bg-overlay dark:hover:bg-overlay disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Anterior
                </button>
                <span className="px-3 py-1 text-sm text-text-base">
                  Página {page} de {totalPaginas}
                </span>
                <button
                  onClick={() => setPage((prev) => Math.min(prev + 1, totalPaginas))}
                  disabled={page === totalPaginas}
                  className="px-3 py-1 text-sm border border-border-base rounded-md bg-surface text-text-soft hover:bg-overlay dark:hover:bg-overlay disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Siguiente
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Detalle de usuario */}
      <Dialog open={!!selectedUser} onOpenChange={(open) => !open && handleCloseDetalle()}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Detalle de usuario</DialogTitle>
            <DialogDescription>
              Información detallada del usuario y su actividad reciente.
            </DialogDescription>
          </DialogHeader>

          {selectedUser && (
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="h-12 w-12 rounded-full bg-brand-primary/10 dark:bg-brand-primary/20 flex items-center justify-center">
                  <UserCircle2 className="h-8 w-8 text-brand-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-text-base">
                    {selectedUser.nombre || selectedUser.apellido
                      ? `${selectedUser.nombre ?? ''} ${selectedUser.apellido ?? ''}`.trim()
                      : selectedUser.nombre_usuario}
                  </h3>
                  <p className="text-sm text-text-soft">
                    {selectedUser.nombre_usuario} •{' '}
                    {selectedUser.cliente.nombre_comercial ||
                      selectedUser.cliente.razon_social}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        selectedUser.es_activo
                          ? 'bg-success/10 text-success'
                          : 'bg-error/10 text-error'
                      }`}
                    >
                      {selectedUser.es_activo ? 'Activo' : 'Inactivo'}
                    </span>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-info/10 text-info">
                      {selectedUser.proveedor_autenticacion}
                    </span>
                    {selectedUser.is_super_admin && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-warning/10 text-warning">
                        Superadmin
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {detalleLoading && (
                <div className="flex items-center justify-center py-4 text-sm text-text-soft">
                  <Loader className="h-4 w-4 animate-spin mr-2" />
                  Cargando actividad y sesiones...
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Datos básicos */}
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-text-base">
                    Información básica
                  </h4>
                  <div className="text-sm text-text-base space-y-1">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-text-soft" />
                      <span>{selectedUser.correo || 'Sin correo'}</span>
                    </div>
                    {selectedUser.dni && (
                      <div>DNI: {selectedUser.dni}</div>
                    )}
                    {selectedUser.telefono && (
                      <div>Teléfono: {selectedUser.telefono}</div>
                    )}
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-text-soft" />
                      <span>
                        Creado:{' '}
                        {new Date(selectedUser.fecha_creacion).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  <h4 className="mt-4 text-sm font-semibold text-text-base">
                    Roles
                  </h4>
                  {selectedUser.roles.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {selectedUser.roles.map((rol) => (
                        <span
                          key={rol.rol_id}
                          className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-subtle text-text-base"
                        >
                          {rol.nombre}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-text-soft">Sin roles asignados.</p>
                  )}
                </div>

                {/* Actividad */}
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-text-base">
                    Actividad reciente
                  </h4>
                  {actividad && actividad.eventos.length > 0 ? (
                    <div className="space-y-2 max-h-48 overflow-y-auto pr-1 text-xs text-text-base">
                      {actividad.eventos.map((ev) => (
                        <div
                          key={ev.log_id}
                          className="border border-border-base rounded-md p-2"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-medium">{ev.evento}</span>
                            <span
                              className={`px-1.5 py-0.5 rounded-full text-[10px] font-semibold ${
                                ev.exito
                                  ? 'bg-success/10 text-success'
                                  : 'bg-error/10 text-error'
                              }`}
                            >
                              {ev.exito ? 'OK' : 'Fallo'}
                            </span>
                          </div>
                          {ev.fecha_evento && (
                            <div className="text-text-soft">
                              {new Date(ev.fecha_evento).toLocaleString()}
                            </div>
                          )}
                          {ev.descripcion && (
                            <div className="mt-1 text-text-base">
                              {ev.descripcion}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-text-soft">
                      No hay eventos de autenticación recientes para este usuario.
                    </p>
                  )}

                  <h4 className="mt-2 text-sm font-semibold text-text-base">
                    Sesiones activas
                  </h4>
                  {sesiones && sesiones.sesiones.length > 0 ? (
                    <p className="text-xs text-text-soft">
                      {sesiones.sesiones_activas} sesión(es) activa(s) actualmente.
                    </p>
                  ) : (
                    <p className="text-xs text-text-soft">
                      No hay sesiones activas registradas para este usuario.
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ClientUsersTab;













