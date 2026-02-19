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
import { seccionService } from '@/features/modulos/services/seccion.service';
import { menuService } from '@/features/admin/services/menu.service';
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

  // Cargar estructura jerárquica completa
  const fetchHierarchicalData = useCallback(async () => {
    if (!isAuthenticated || authLoading) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const modulosData = await moduloV2Service.getModulos({ es_activo: true });
      const hierarchicalNodes: HierarchicalNode[] = [];

      // ✅ Validación defensiva
      const modulosItems = Array.isArray(modulosData.items) ? modulosData.items : [];
      for (const modulo of modulosItems) {
        // Filtrar por módulo si está seleccionado
        if (selectedModuloId && modulo.modulo_id !== selectedModuloId) {
          continue;
        }

        const moduloNode: HierarchicalNode = {
          id: modulo.modulo_id,
          type: 'modulo',
          nombre: modulo.nombre,
          icono: modulo.icono,
          color: modulo.color,
          es_activo: modulo.es_activo,
          children: [],
          data: modulo
        };

        // Cargar secciones del módulo
        try {
          const seccionesData = await seccionService.getSecciones({
            modulo_id: modulo.modulo_id,
            es_activa: true
          });

          // ✅ Validación defensiva
          const seccionesItems = Array.isArray(seccionesData.items) ? seccionesData.items : [];
          for (const seccion of seccionesItems) {
            const seccionNode: HierarchicalNode = {
              id: seccion.seccion_id,
              type: 'seccion',
              nombre: seccion.nombre,
              icono: seccion.icono,
              es_activo: seccion.es_activa,
              children: [],
              data: seccion
            };

            // Cargar menús de la sección usando el endpoint correcto
            try {
              // ✅ ACTUALIZADO: Usar getMenusByModulo con filtro de sección
              const menusData = await menuService.getMenusByModulo(modulo.modulo_id, seccion.seccion_id);
              
              // ✅ Validación defensiva
              const menusArray = Array.isArray(menusData) ? menusData : [];
              
              const transformMenuToNode = (menu: BackendManageMenuItem): HierarchicalNode => {
                const menuNode: HierarchicalNode = {
                  id: menu.menu_id,
                  type: 'menu',
                  nombre: menu.nombre,
                  icono: menu.icono,
                  ruta: menu.ruta,
                  es_activo: menu.es_activo,
                  children: [],
                  data: menu
                };

                if (menu.children && Array.isArray(menu.children) && menu.children.length > 0) {
                  menuNode.children = menu.children.map(transformMenuToNode);
                }

                return menuNode;
              };

              seccionNode.children = menusArray.map(transformMenuToNode);
            } catch (err: any) {
              // Si el endpoint retorna 404/500, simplemente no mostrar menús para esta sección
              if (err?.response?.status === 404 || err?.response?.status === 500) {
                if (import.meta.env.DEV) {
                  console.warn(`⚠️ No se pudieron cargar menús para sección ${seccion.seccion_id} del módulo ${modulo.modulo_id}:`, err?.response?.status);
                }
                seccionNode.children = [];
              } else {
                console.error(`Error cargando menús de sección ${seccion.seccion_id}:`, err);
              }
            }

            moduloNode.children.push(seccionNode);
          }
        } catch (err) {
          console.error(`Error cargando secciones de módulo ${modulo.modulo_id}:`, err);
        }

        hierarchicalNodes.push(moduloNode);
      }

      setHierarchicalData(hierarchicalNodes);
      
      // Expandir todos los nodos por defecto
      const allNodeIds = new Set<string>();
      const collectIds = (nodes: HierarchicalNode[]) => {
        nodes.forEach(node => {
          allNodeIds.add(node.id);
          if (node.children.length > 0) {
            collectIds(node.children);
          }
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
          className={`flex items-center gap-2 py-2 px-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer group ${
            !node.es_activo ? 'opacity-60' : ''
          }`}
          style={{ paddingLeft: `${indent + 12}px` }}
          onClick={handleNodeClick}
        >
          {/* Expandir/Colapsar */}
          <div className="w-4 flex-shrink-0">
            {hasChildren ? (
              isExpanded ? (
                <ChevronDown className="h-4 w-4 text-gray-500" />
              ) : (
                <ChevronRight className="h-4 w-4 text-gray-500" />
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
              <span className="text-sm font-medium text-gray-900 dark:text-white truncate">
                {node.nombre}
              </span>
              {node.type === 'menu' && node.ruta && (
                <span className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  {node.ruta}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 mt-1">
              <span className={`text-xs px-2 py-0.5 rounded ${
                node.type === 'modulo'
                  ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                  : node.type === 'seccion'
                  ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
                  : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
              }`}>
                {node.type === 'modulo' ? 'Módulo' : node.type === 'seccion' ? 'Sección' : 'Menú'}
              </span>
              {node.es_activo === false && (
                <span className="text-xs px-2 py-0.5 rounded bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                  Inactivo
                </span>
              )}
            </div>
          </div>

          {/* Acciones rápidas */}
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={handleEdit}
              className="p-1 text-brand-primary hover:text-brand-primary/80 rounded hover:bg-gray-200 dark:hover:bg-gray-600"
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
          <Package className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">Acceso restringido</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
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
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Vista Jerárquica Completa
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Visualiza toda la estructura del sistema: Módulos → Secciones → Menús
        </p>
      </div>
      */}
      {/* Barra de herramientas */}
      <div className="mb-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
          {/* Filtros */}
          <div className="flex flex-col sm:flex-row gap-3 flex-1">
            {/* Selector de Módulo */}
            <div className="sm:w-64">
              <label htmlFor="modulo-filter" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Filtrar por Módulo
              </label>
              <select
                id="modulo-filter"
                value={selectedModuloId}
                onChange={(e) => {
                  setSelectedModuloId(e.target.value);
                }}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-brand-primary dark:bg-gray-700 dark:text-white"
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
              <label htmlFor="search" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Buscar
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  id="search"
                  placeholder="Buscar en la estructura..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 w-full border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-brand-primary dark:bg-gray-700 dark:text-white"
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
              className="px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              title="Expandir todo"
            >
              Expandir Todo
            </button>
            <button
              onClick={() => setExpandedNodes(new Set())}
              className="px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              title="Colapsar todo"
            >
              Colapsar Todo
            </button>
            <button
              onClick={fetchHierarchicalData}
              disabled={loading}
              className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              title="Actualizar"
            >
              <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Package className="h-8 w-8 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Módulos</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                {hierarchicalData.length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Folder className="h-8 w-8 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Secciones</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                {hierarchicalData.reduce((acc, m) => acc + (m.children?.length || 0), 0)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Menu className="h-8 w-8 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Menús</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">
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
        <div className="mb-4 p-3 bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-200 rounded">
          {error}
        </div>
      )}

      {/* Árbol Jerárquico */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="animate-spin h-6 w-6 text-brand-primary" />
            <span className="ml-2 text-gray-600 dark:text-gray-400">Cargando estructura...</span>
          </div>
        ) : filteredData.length === 0 ? (
          <div className="p-12 text-center">
            <Package className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <p className="text-gray-500 dark:text-gray-400">
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

