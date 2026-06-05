import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { toast } from 'react-hot-toast';
import {
  ChevronRight,
  ChevronDown,
  Package,
  Folder,
  Menu,
  Edit3,
  RefreshCw,
  Search,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { moduloV2Service } from '@/features/modulos/services/modulo-v2.service';
import { menuService } from '@/features/admin/services/menu.service';
import type { AuthMenuModulo, AuthMenuItem } from '@/core/auth/types/auth-menu.types';
import type { ModuloV2 } from '@/features/modulos/types/modulo-v2.types';
import type { Seccion } from '@/features/modulos/types/seccion.types';
import type { BackendManageMenuItem } from '@/features/admin/types/menu.types';
import { useAuth } from '@/shared/context/AuthContext';
import { getErrorMessage } from '@/core/services/error.service';
import { getIcon } from '@/shared/lib/icon-utils';

interface HierarchicalNode {
  id: string;
  type: 'modulo' | 'seccion' | 'menu';
  nombre: string;
  icono?: string | null;
  color?: string | null;
  ruta?: string | null;
  es_activo?: boolean;
  children: HierarchicalNode[];
  data?: ModuloV2 | Seccion | BackendManageMenuItem;
}

/** Convierte AuthMenuItem (desde /auth/menu) en HierarchicalNode (recursivo por submenus). */
function authMenuItemToNode(menu: AuthMenuItem): HierarchicalNode {
  return {
    id: menu.menu_id,
    type: 'menu',
    nombre: menu.nombre,
    icono: menu.icono ?? null,
    ruta: menu.ruta ?? null,
    es_activo: menu.is_visible && menu.is_enabled,
    children: (menu.submenus ?? []).map(authMenuItemToNode),
    data: menu as unknown as BackendManageMenuItem,
  };
}

/** Convierte AuthMenuModulo[] (respuesta de getAuthMenu) en HierarchicalNode[]. */
function authModulosToHierarchicalNodes(
  modulos: AuthMenuModulo[],
  filterModuloId?: string
): HierarchicalNode[] {
  const list = filterModuloId ? modulos.filter((m) => m.modulo_id === filterModuloId) : modulos;
  return list.map((mod) => ({
    id: mod.modulo_id,
    type: 'modulo' as const,
    nombre: mod.nombre,
    icono: mod.icono ?? null,
    color: mod.color ?? null,
    es_activo: true,
    children: (mod.secciones || []).map((sec) => ({
      id: sec.seccion_id,
      type: 'seccion' as const,
      nombre: sec.nombre,
      icono: sec.icono ?? null,
      es_activo: true,
      children: (sec.menus || []).map(authMenuItemToNode),
      data: sec as unknown as Seccion,
    })),
    data: mod as unknown as ModuloV2,
  }));
}

const HierarchicalViewPage: React.FC = () => {
  const { isSuperAdmin, isAuthenticated, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [modulos, setModulos] = useState<ModuloV2[]>([]);
  const [hierarchicalData, setHierarchicalData] = useState<HierarchicalNode[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedModuloId, setSelectedModuloId] = useState<string>('');

  // Cargar módulos
  const fetchModulos = useCallback(async () => {
    try {
      const data = await moduloV2Service.getModulos({ es_activo: true });
      // ✅ Validación defensiva
      const items = Array.isArray(data.items) ? data.items : [];
      setModulos(items);
    } catch (err) {
      console.error('Error cargando módulos:', err);
      setModulos([]);
    }
  }, []);

  // Cargar estructura jerárquica desde GET /auth/menu
  const fetchHierarchicalData = useCallback(async () => {
    if (!isAuthenticated || authLoading) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await menuService.getAuthMenu();
      const hierarchicalNodes = authModulosToHierarchicalNodes(
        response.modulos || [],
        selectedModuloId || undefined
      );

      setHierarchicalData(hierarchicalNodes);

      const allNodeIds = new Set<string>();
      const collectIds = (nodes: HierarchicalNode[]) => {
        nodes.forEach((node) => {
          allNodeIds.add(node.id);
          if (node.children.length > 0) collectIds(node.children);
        });
      };
      collectIds(hierarchicalNodes);
      setExpandedNodes(allNodeIds);
    } catch (err) {
      console.error('❌ Error cargando estructura jerárquica:', err);
      const errorData = getErrorMessage(err);
      setError(errorData.message || 'Error al cargar la estructura jerárquica');
      toast.error(errorData.message || 'Error al cargar la estructura jerárquica');
    } finally {
      setLoading(false);
    }
  }, [selectedModuloId, isAuthenticated, authLoading]);

  useEffect(() => {
    if (isAuthenticated && !authLoading) {
      fetchModulos();
    }
  }, [isAuthenticated, authLoading, fetchModulos]);

  useEffect(() => {
    fetchHierarchicalData();
  }, [fetchHierarchicalData]);

  // Toggle expandir/colapsar nodo
  const toggleNode = (nodeId: string) => {
    setExpandedNodes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(nodeId)) {
        newSet.delete(nodeId);
      } else {
        newSet.add(nodeId);
      }
      return newSet;
    });
  };

  // Filtrar datos por búsqueda
  const filteredData = useMemo(() => {
    if (!searchTerm) return hierarchicalData;

    const filterNodes = (nodes: HierarchicalNode[]): HierarchicalNode[] => {
      return nodes
        .map(node => {
          if (!node) return null;
          const matchesSearch = node.nombre?.toLowerCase().includes(searchTerm.toLowerCase());
          const filteredChildren = filterNodes(node.children || []);
          
          if (matchesSearch || filteredChildren.length > 0) {
            return {
              ...node,
              children: filteredChildren
            };
          }
          return null;
        })
        .filter((node): node is HierarchicalNode => node !== null);
    };

    return filterNodes(hierarchicalData);
  }, [hierarchicalData, searchTerm]);

  // Renderizar nodo del árbol
  const renderNode = (node: HierarchicalNode, level: number = 0): JSX.Element => {
    const isExpanded = expandedNodes.has(node.id);
    const hasChildren = node.children && Array.isArray(node.children) && node.children.length > 0;
    const indent = level * 24;

    const getNodeIcon = () => {
      switch (node.type) {
        case 'modulo':
          return getIcon(node.icono || 'Package', Package);
        case 'seccion':
          return getIcon(node.icono || 'Folder', Folder);
        case 'menu':
          return getIcon(node.icono || 'Menu', Menu);
        default:
          return null;
      }
    };

    const getNodeColor = () => {
      if (node.type === 'modulo' && node.color) {
        return node.color;
      }
      return undefined;
    };

    const handleNodeClick = () => {
      if (hasChildren) {
        toggleNode(node.id);
      }
    };

    const handleEdit = (e: React.MouseEvent) => {
      e.stopPropagation();
      switch (node.type) {
        case 'modulo':
          navigate(`/super-admin/modulos`);
          break;
        case 'seccion':
          navigate(`/super-admin/secciones`);
          break;
        case 'menu':
          navigate(`/super-admin/menus`);
          break;
      }
    };

    return (
      <div key={node.id} className="select-none">
        <div
          className={`flex items-center gap-2 py-2 px-3 rounded-lg hover:bg-overlay dark:hover:bg-overlay cursor-pointer group ${
            !node.es_activo ? 'opacity-60' : ''
          }`}
          style={{ paddingLeft: `${indent + 12}px` }}
          onClick={handleNodeClick}
        >
          {/* Expandir/Colapsar */}
          <div className="w-4 flex-shrink-0">
            {hasChildren ? (
              isExpanded ? (
                <ChevronDown className="h-4 w-4 text-text-soft" />
              ) : (
                <ChevronRight className="h-4 w-4 text-text-soft" />
              )
            ) : (
              <span className="w-4" />
            )}
          </div>

          {/* Icono */}
          <div
            className="flex-shrink-0 h-8 w-8 rounded-lg flex items-center justify-center"
            style={{
              backgroundColor: getNodeColor() ? `${getNodeColor()}20` : undefined,
              color: getNodeColor() || undefined
            }}
          >
            {getNodeIcon()}
          </div>

          {/* Nombre y detalles */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-text-base truncate">
                {node.nombre}
              </span>
              {node.type === 'menu' && node.ruta && (
                <span className="text-xs text-text-soft truncate">
                  {node.ruta}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 mt-1">
              <span className={`text-xs px-2 py-0.5 rounded ${
                node.type === 'modulo'
                  ? 'bg-info/10 text-info'
                  : node.type === 'seccion'
                  ? 'bg-subtle text-text-soft dark:bg-subtle dark:text-text-soft'
                  : 'bg-success/10 text-success'
              }`}>
                {node.type === 'modulo' ? 'Módulo' : node.type === 'seccion' ? 'Sección' : 'Menú'}
              </span>
              {node.es_activo === false && (
                <span className="text-xs px-2 py-0.5 rounded bg-error/10 text-error">
                  Inactivo
                </span>
              )}
            </div>
          </div>

          {/* Acciones rápidas */}
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={handleEdit}
              className="p-1 text-brand-primary hover:text-brand-primary/80 rounded hover:bg-overlay dark:hover:bg-overlay"
              title="Ir a gestión"
            >
              <Edit3 className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Renderizar hijos si está expandido */}
        {hasChildren && isExpanded && node.children && (
          <div>
            {node.children.map(child => renderNode(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  // Si no es super admin
  if (!isSuperAdmin) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Package className="mx-auto h-12 w-12 text-text-soft" />
          <h3 className="mt-2 text-sm font-medium text-text-base">Acceso restringido</h3>
          <p className="mt-1 text-sm text-text-soft">
            No tienes permisos para acceder a la vista jerárquica.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Header */}
      {/*
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-text-base">
          Vista Jerárquica Completa
        </h1>
        <p className="mt-1 text-sm text-text-soft">
          Visualiza toda la estructura del sistema: Módulos → Secciones → Menús
        </p>
      </div>
      */}
      {/* Barra de herramientas */}
      <div className="mb-6 bg-surface rounded-lg shadow-sm border border-border-base p-4">
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
          {/* Filtros */}
          <div className="flex flex-col sm:flex-row gap-3 flex-1">
            {/* Selector de Módulo */}
            <div className="sm:w-64">
              <label htmlFor="modulo-filter" className="block text-sm font-medium text-text-soft mb-1">
                Filtrar por Módulo
              </label>
              <select
                id="modulo-filter"
                value={selectedModuloId}
                onChange={(e) => {
                  setSelectedModuloId(e.target.value);
                }}
                className="w-full px-3 py-2 border border-border-base rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-brand-primary bg-surface dark:bg-subtle dark:text-text-base"
              >
                <option value="">Todos los módulos</option>
                    {modulos && modulos.length > 0 && modulos.map((modulo) => (
                      <option key={modulo.modulo_id} value={modulo.modulo_id}>
                        {modulo.nombre}
                      </option>
                    ))}
              </select>
            </div>

            {/* Búsqueda */}
            <div className="flex-1">
              <label htmlFor="search" className="block text-sm font-medium text-text-soft mb-1">
                Buscar
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-text-soft" />
                <input
                  type="text"
                  id="search"
                  placeholder="Buscar en la estructura..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 w-full border border-border-base rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-brand-primary bg-surface dark:bg-subtle dark:text-text-base"
                />
              </div>
            </div>
          </div>

          {/* Acciones */}
          <div className="flex gap-2">
            <button
              onClick={() => {
                const allIds = new Set<string>();
                const collectIds = (nodes: HierarchicalNode[]) => {
                  nodes.forEach(node => {
                    allIds.add(node.id);
                    if (node.children.length > 0) {
                      collectIds(node.children);
                    }
                  });
                };
                collectIds(filteredData);
                setExpandedNodes(allIds);
              }}
              className="px-3 py-2 text-sm text-text-soft hover:bg-overlay dark:hover:bg-overlay rounded-lg transition-colors"
              title="Expandir todo"
            >
              Expandir Todo
            </button>
            <button
              onClick={() => setExpandedNodes(new Set())}
              className="px-3 py-2 text-sm text-text-soft hover:bg-overlay dark:hover:bg-overlay rounded-lg transition-colors"
              title="Colapsar todo"
            >
              Colapsar Todo
            </button>
            <button
              onClick={fetchHierarchicalData}
              disabled={loading}
              className="p-2 text-text-soft hover:text-text-base dark:hover:text-text-base hover:bg-overlay dark:hover:bg-overlay rounded-lg transition-colors"
              title="Actualizar"
            >
              <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-surface rounded-lg shadow-sm border border-border-base p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Package className="h-8 w-8 text-info" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-text-soft">Módulos</p>
              <p className="text-2xl font-semibold text-text-base">
                {hierarchicalData.length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-surface rounded-lg shadow-sm border border-border-base p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Folder className="h-8 w-8 text-text-soft" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-text-soft">Secciones</p>
              <p className="text-2xl font-semibold text-text-base">
                {hierarchicalData.reduce((acc, m) => acc + (m.children?.length || 0), 0)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-surface rounded-lg shadow-sm border border-border-base p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Menu className="h-8 w-8 text-success" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-text-soft">Menús</p>
              <p className="text-2xl font-semibold text-text-base">
                {(() => {
                  const countMenus = (nodes: HierarchicalNode[]): number => {
                    return nodes.reduce((acc, node) => {
                      if (node.type === 'menu') {
                        return acc + 1 + countMenus(node.children);
                      }
                  return acc + countMenus(node.children || []);
                }, 0);
              };
              return countMenus(hierarchicalData);
                })()}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 p-3 bg-error/10 border border-error/30 text-error rounded">
          {error}
        </div>
      )}

      {/* Árbol Jerárquico */}
      <div className="bg-surface rounded-lg shadow-sm border border-border-base overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="animate-spin h-6 w-6 text-brand-primary" />
            <span className="ml-2 text-text-soft">Cargando estructura...</span>
          </div>
        ) : filteredData.length === 0 ? (
          <div className="p-12 text-center">
            <Package className="mx-auto h-12 w-12 text-text-soft mb-4" />
            <p className="text-text-soft">
              {searchTerm ? 'No se encontraron resultados para la búsqueda' : 'No hay datos para mostrar'}
            </p>
          </div>
        ) : (
          <div className="p-4">
            {filteredData.map(node => renderNode(node, 0))}
          </div>
        )}
      </div>
    </div>
  );
};

export default HierarchicalViewPage;

