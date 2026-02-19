import type { AxiosInstance } from 'axios';
import api from '@/core/api/api'; // Instancia por defecto (misma URL del tenant en cloud; en on-premise se puede inyectar la del cliente)
import type {
  // Tipos para Sidebar (renombrados)
  SidebarMenuItem,
  SidebarMenuResponse,
  // Tipos para Gestión de Menús (nuevos)
  AreaSimpleList,
  BackendManageMenuItem, // El tipo directo del backend para el árbol de gestión
  MenuTreeResponse,      // La envoltura { menu: BackendManageMenuItem[] }
  MenuCreateData,
  MenuUpdateData,
  MenuSingleResponse,    // Para respuestas de POST/PUT/GET por ID
  // Tipos nuevos para estructura jerárquica V2
  ModuloMenuResponse,
  ModuloConSecciones,
} from '../types/menu.types'; // Asegúrate que la ruta sea correcta

// --- Servicio de Menú ---
export const menuService = {
  /**
   * ⚠️ DEPRECADO: Obtiene el menú para el usuario autenticado (estructura antigua).
   * Usa getUserMenu() en su lugar para la nueva estructura jerárquica.
   * Llama a GET /menus/getmenu/
   * @deprecated Usar getUserMenu() en su lugar
   */
  getSidebarMenu: async (): Promise<SidebarMenuItem[]> => { // Devuelve el array directamente
    const endpoint = '/menus/getmenu/'; // <-- agregado /
    if (import.meta.env.DEV) {
      console.warn('⚠️ [MenuService] getSidebarMenu() está deprecado. Usar getUserMenu() en su lugar.');
    }
    try {
      // Usa el tipo renombrado para la respuesta
      const response = await api.get<SidebarMenuResponse>(endpoint);
      if (response.data && Array.isArray(response.data.menu)) {
        return response.data.menu; // Devuelve solo el array de menú
      } else {
        console.error(`Respuesta inesperada de ${endpoint}:`, response.data);
        return []; // Devuelve array vacío si el formato no es correcto
      }
    } catch (error) {
      console.error(`Error fetching sidebar menu from ${endpoint}:`, error);
      // Considera lanzar el error para que el componente lo maneje
      // throw error;
      return []; // O devuelve array vacío
    }
  },

  /**
   * ✅ NUEVO: Obtiene el menú del usuario con estructura jerárquica (Módulos → Secciones → Menús).
   * Endpoint: GET /modulos-menus/usuario/{usuario_id}/
   * 
   * @param usuarioId - ID del usuario (UUID)
   * @param clienteId - ID del cliente (UUID) - Opcional pero recomendado para clientes "dedicated"
   * @returns Promise con la estructura jerárquica completa del menú
   */
  getUserMenu: async (usuarioId: string, clienteId?: string): Promise<ModuloConSecciones[]> => {
    if (!usuarioId || typeof usuarioId !== 'string') {
      throw new Error('usuarioId es requerido y debe ser un string');
    }

    const endpoint = `/modulos-menus/usuario/${usuarioId}/`;
    
    // ✅ ACTUALIZADO: Construir parámetros de query si se proporciona cliente_id
    // Esto es especialmente importante para clientes "dedicated" que necesitan identificar su BD
    const params: Record<string, string> = {};
    if (clienteId && typeof clienteId === 'string' && clienteId.trim() !== '') {
      params.cliente_id = clienteId;
    }

    try {
      const response = await api.get<ModuloMenuResponse>(endpoint, {
        params: Object.keys(params).length > 0 ? params : undefined,
      });
      
      if (response.data && Array.isArray(response.data.modulos)) {
        if (import.meta.env.DEV) {
          console.log(`✅ [MenuService] Menú obtenido para usuario ${usuarioId}${clienteId ? ` (cliente: ${clienteId})` : ''}:`, {
            totalModulos: response.data.modulos.length,
            modulos: response.data.modulos.map(m => m.nombre)
          });
        }
        return response.data.modulos;
      } else {
        console.error(`Respuesta inesperada de ${endpoint}:`, response.data);
        return [];
      }
    } catch (error) {
      console.error(`Error fetching user menu from ${endpoint}:`, error);
      throw error; // Lanzar error para que el componente lo maneje
    }
  },

  /**
   * ⚠️ DEPRECADO: Obtiene la lista simple de áreas activas (para el selector).
   * Llama a GET /areas/list/
   * 
   * ✅ NUEVO: Usar seccionService.getSecciones() en su lugar
   * @deprecated Usar seccionService.getSecciones() para nueva estructura
   */
  getAreaList: async (): Promise<AreaSimpleList[]> => {
    if (import.meta.env.DEV) {
      console.warn('⚠️ [MenuService] getAreaList() está deprecado. Usar seccionService.getSecciones() en su lugar.');
    }
    const endpoint = '/areas/list/'; // <-- agregado /
    try {
      // Espera una respuesta que es directamente un array de AreaSimpleList
      const response = await api.get<AreaSimpleList[]>(endpoint);
      // Verifica que la respuesta sea un array
      if (Array.isArray(response.data)) {
        return response.data;
      } else {
        console.error(`Respuesta inesperada de ${endpoint} (no es un array):`, response.data);
        return [];
      }
    } catch (error) {
      console.error(`Error fetching area list from ${endpoint}:`, error);
      // throw error;
      return [];
    }
  },

  /**
   * ⚠️ DEPRECADO: Obtiene el árbol de menú (activos e inactivos) para un área específica.
   * Llama a GET /menus/area/{area_id}/tree/
   * 
   * ✅ NUEVO: Usar getUserMenu() o endpoints de /modulos-menus/ en su lugar
   * @param areaId - El ID del área para la que se quiere obtener el menú.
   * @deprecated Usar getUserMenu() o endpoints de /modulos-menus/ para nueva estructura
   */
  getMenuTreeByArea: async (areaId: string): Promise<BackendManageMenuItem[]> => {
    if (import.meta.env.DEV) {
      console.warn('⚠️ [MenuService] getMenuTreeByArea() está deprecado. Usar getUserMenu() o endpoints de /modulos-menus/ en su lugar.');
    }
    // Valida que areaId sea un string válido antes de llamar
    if (typeof areaId !== 'string' || !areaId.trim()) {
        console.error('getMenuTreeByArea: areaId inválido:', areaId);
        return [];
    }
    const endpoint = `/menus/area/${areaId}/tree/`; // <-- agregado /
    try {
      // Usa el tipo MenuTreeResponse que envuelve el array
      const response = await api.get<MenuTreeResponse>(endpoint);
      if (response.data && Array.isArray(response.data.menu)) {
        return response.data.menu; // Devuelve solo el array de menú
      } else {
        console.error(`Respuesta inesperada de ${endpoint}:`, response.data);
        return [];
      }
    } catch (error) {
      console.error(`Error fetching menu tree for area ${areaId} from ${endpoint}:`, error);
      // throw error;
      return [];
    }
  },

  /**
   * ✅ CORREGIDO: Crea un nuevo ítem de menú.
   * Endpoint: POST /modulos-menus/
   * @param menuData - Datos del menú a crear (debe incluir modulo_id y seccion_id).
   */
  createMenuItem: async (menuData: MenuCreateData): Promise<MenuSingleResponse> => {
    const endpoint = '/modulos-menus/';
    try {
      // ✅ El backend espera ModuloMenuCreate con modulo_id y seccion_id
      // Transformar MenuCreateData (que usa area_id) a ModuloMenuCreate (que usa seccion_id y modulo_id)
      interface ModuloMenuCreatePayload {
        nombre: string;
        modulo_id: string;
        seccion_id?: string | null;
        menu_padre_id?: string | null;
        icono?: string | null;
        ruta?: string | null;
        nivel?: number;
        tipo_menu?: string;
        orden?: number;
        es_activo?: boolean;
        descripcion?: string | null;
        codigo?: string | null;
        requiere_autenticacion?: boolean;
        es_visible?: boolean;
        es_menu_sistema?: boolean;
        configuracion_json?: string | null;
        cliente_id?: string | null;
      }

      const payload: ModuloMenuCreatePayload = {
        nombre: menuData.nombre,
        modulo_id: (menuData as any).modulo_id || '', // ✅ Requerido por backend
        seccion_id: (menuData as any).seccion_id || menuData.area_id || null, // ✅ Usar seccion_id si está disponible, sino area_id
        menu_padre_id: menuData.padre_menu_id || null,
        icono: menuData.icono || null,
        ruta: menuData.ruta || null,
        nivel: (menuData as any).nivel || 1,
        tipo_menu: (menuData as any).tipo_menu || 'pantalla',
        orden: menuData.orden || 0,
        es_activo: menuData.es_activo !== undefined ? menuData.es_activo : true,
        descripcion: (menuData as any).descripcion || null,
        codigo: (menuData as any).codigo || null,
        requiere_autenticacion: (menuData as any).requiere_autenticacion !== undefined ? (menuData as any).requiere_autenticacion : true,
        es_visible: (menuData as any).es_visible !== undefined ? (menuData as any).es_visible : true,
        es_menu_sistema: (menuData as any).es_menu_sistema !== undefined ? (menuData as any).es_menu_sistema : false,
        configuracion_json: (menuData as any).configuracion_json || null,
        cliente_id: (menuData as any).cliente_id || null,
      };

      interface ModuloMenuResponse {
        success: boolean;
        message: string;
        data: {
          menu_id: string;
          nombre: string;
          icono?: string | null;
          ruta?: string | null;
          menu_padre_id?: string | null;
          orden?: number | null;
          es_activo: boolean;
          seccion_id?: string | null;
          modulo_id?: string | null;
          fecha_creacion: string;
          fecha_actualizacion?: string | null;
        };
      }

      const response = await api.post<ModuloMenuResponse>(endpoint, payload);
      
      if (response.data && response.data.success && response.data.data) {
        // Transformar la respuesta del backend a MenuSingleResponse
        const menuResponse: MenuSingleResponse = {
          menu_id: response.data.data.menu_id,
          nombre: response.data.data.nombre,
          icono: response.data.data.icono || null,
          ruta: response.data.data.ruta || null,
          padre_menu_id: response.data.data.menu_padre_id || null,
          orden: response.data.data.orden || null,
          es_activo: response.data.data.es_activo,
          area_id: response.data.data.seccion_id || null, // Temporal: mapear seccion_id a area_id
          fecha_creacion: response.data.data.fecha_creacion,
          fecha_actualizacion: response.data.data.fecha_actualizacion || null,
        };
        return menuResponse;
      } else {
        throw new Error('Respuesta inesperada del servidor');
      }
    } catch (error) {
      console.error(`Error creating menu item via ${endpoint}:`, error);
      throw error;
    }
  },

  /**
   * ✅ CORREGIDO: Actualiza un ítem de menú existente.
   * Endpoint: PUT /modulos-menus/{menu_id}/
   * @param menuId - ID del menú a actualizar.
   * @param menuData - Datos a actualizar (solo los campos a cambiar).
   */
  updateMenuItem: async (menuId: string, menuData: MenuUpdateData): Promise<MenuSingleResponse> => {
    const endpoint = `/modulos-menus/${menuId}/`;
    try {
      // ✅ El backend espera ModuloMenuUpdate
      interface ModuloMenuUpdatePayload {
        nombre?: string;
        seccion_id?: string | null;
        menu_padre_id?: string | null;
        icono?: string | null;
        ruta?: string | null;
        nivel?: number;
        tipo_menu?: string;
        orden?: number;
        es_activo?: boolean;
        descripcion?: string | null;
        codigo?: string | null;
        requiere_autenticacion?: boolean;
        es_visible?: boolean;
        es_menu_sistema?: boolean;
        configuracion_json?: string | null;
      }

      const payload: ModuloMenuUpdatePayload = {
        nombre: menuData.nombre,
        seccion_id: (menuData as any).seccion_id || menuData.area_id || null, // ✅ Usar seccion_id si está disponible, sino area_id
        menu_padre_id: menuData.padre_menu_id || null,
        icono: menuData.icono || null,
        ruta: menuData.ruta || null,
        nivel: (menuData as any).nivel,
        tipo_menu: (menuData as any).tipo_menu,
        orden: menuData.orden ?? undefined,
        es_activo: menuData.es_activo,
        descripcion: (menuData as any).descripcion,
        codigo: (menuData as any).codigo,
        requiere_autenticacion: (menuData as any).requiere_autenticacion,
        es_visible: (menuData as any).es_visible,
        es_menu_sistema: (menuData as any).es_menu_sistema,
        configuracion_json: (menuData as any).configuracion_json,
      };

      // Eliminar campos undefined
      Object.keys(payload).forEach(key => {
        if (payload[key as keyof ModuloMenuUpdatePayload] === undefined) {
          delete payload[key as keyof ModuloMenuUpdatePayload];
        }
      });

      interface ModuloMenuResponse {
        success: boolean;
        message: string;
        data: {
          menu_id: string;
          nombre: string;
          icono?: string | null;
          ruta?: string | null;
          menu_padre_id?: string | null;
          orden?: number | null;
          es_activo: boolean;
          seccion_id?: string | null;
          modulo_id?: string | null;
          fecha_creacion: string;
          fecha_actualizacion?: string | null;
        };
      }

      const response = await api.put<ModuloMenuResponse>(endpoint, payload);
      
      if (response.data && response.data.success && response.data.data) {
        // Transformar la respuesta del backend a MenuSingleResponse
        const menuResponse: MenuSingleResponse = {
          menu_id: response.data.data.menu_id,
          nombre: response.data.data.nombre,
          icono: response.data.data.icono || null,
          ruta: response.data.data.ruta || null,
          padre_menu_id: response.data.data.menu_padre_id || null,
          orden: response.data.data.orden || null,
          es_activo: response.data.data.es_activo,
          area_id: response.data.data.seccion_id || null, // Temporal: mapear seccion_id a area_id
          fecha_creacion: response.data.data.fecha_creacion,
          fecha_actualizacion: response.data.data.fecha_actualizacion || null,
        };
        return menuResponse;
      } else {
        throw new Error('Respuesta inesperada del servidor');
      }
    } catch (error) {
      console.error(`Error updating menu item ${menuId} via ${endpoint}:`, error);
      throw error;
    }
  },

  /**
   * ✅ CORREGIDO: Desactiva un ítem de menú.
   * Endpoint: PATCH /modulos-menus/{menu_id}/desactivar/
   * @param menuId - ID del menú a desactivar.
   */
  deactivateMenuItem: async (menuId: string): Promise<Record<string, any>> => {
    const endpoint = `/modulos-menus/${menuId}/desactivar/`;
    try {
      interface ModuloMenuDesactivarResponse {
        success: boolean;
        message: string;
        data?: {
          menu_id: string;
          es_activo: boolean;
        };
      }
      const response = await api.patch<ModuloMenuDesactivarResponse>(endpoint);
      return response.data;
    } catch (error) {
      console.error(`Error deactivating menu item ${menuId} via ${endpoint}:`, error);
      throw error;
    }
  },

  /**
   * ✅ CORREGIDO: Reactiva un ítem de menú previamente desactivado.
   * Endpoint: PATCH /modulos-menus/{menu_id}/activar/
   * @param menuId - ID del menú a reactivar.
   */
  reactivateMenuItem: async (menuId: string): Promise<Record<string, any>> => {
    const endpoint = `/modulos-menus/${menuId}/activar/`;
    try {
      interface ModuloMenuActivarResponse {
        success: boolean;
        message: string;
        data?: {
          menu_id: string;
          es_activo: boolean;
        };
      }
      const response = await api.patch<ModuloMenuActivarResponse>(endpoint);
      return response.data;
    } catch (error) {
      console.error(`Error reactivating menu item ${menuId} via ${endpoint}:`, error);
      throw error;
    }
  },

  /**
   * ✅ NUEVO: Obtiene los menús de un módulo específico.
   * Endpoint: GET /modulos-menus/modulo/{modulo_id}/
   * Respuesta: { success: boolean, message: string, data: ModuloMenu[] }
   * 
   * @param moduloId - ID del módulo (UUID)
   * @returns Promise con la lista de menús del módulo
   */
  getMenusByModulo: async (moduloId: string, seccionId?: string): Promise<BackendManageMenuItem[]> => {
    if (!moduloId || typeof moduloId !== 'string') {
      throw new Error('moduloId es requerido y debe ser un string');
    }

    const endpoint = `/modulos-menus/modulo/${moduloId}/`;
    
    // ✅ ACTUALIZADO: Construir parámetros de query si se proporciona seccion_id
    const params: Record<string, string> = {};
    if (seccionId && typeof seccionId === 'string' && seccionId.trim() !== '') {
      params.seccion_id = seccionId;
    }

    try {
      interface ModuloMenusResponse {
        success: boolean;
        message: string;
        data: Array<{
          menu_id: string;
          codigo: string;
          nombre: string;
          descripcion?: string | null;
          icono?: string | null;
          ruta?: string | null;
          menu_padre_id?: string | null;
          nivel: number;
          tipo_menu: string;
          orden: number;
          requiere_autenticacion: boolean;
          es_visible: boolean;
          es_menu_sistema: boolean;
          es_activo: boolean;
          configuracion_json?: any;
          modulo_id: string;
          seccion_id: string;
          cliente_id?: string | null;
          fecha_creacion: string;
          fecha_actualizacion?: string | null;
        }>;
      }

      const response = await api.get<ModuloMenusResponse>(endpoint, {
        params: Object.keys(params).length > 0 ? params : undefined,
      });
      
      if (response.data && response.data.success && Array.isArray(response.data.data)) {
        // Convertir la respuesta del backend a BackendManageMenuItem[]
        const menus: BackendManageMenuItem[] = response.data.data.map(menu => ({
          menu_id: menu.menu_id,
          nombre: menu.nombre,
          icono: menu.icono || null,
          ruta: menu.ruta || null,
          padre_menu_id: menu.menu_padre_id || null,
          orden: menu.orden,
          es_activo: menu.es_activo,
          area_id: menu.seccion_id, // Temporal: usar seccion_id como area_id
          seccion_id: menu.seccion_id, // ✅ NUEVO: Agregar seccion_id directamente
          modulo_id: menu.modulo_id, // ✅ NUEVO: Agregar modulo_id si está disponible
          level: menu.nivel,
          children: [], // Los submenús se construirán después si hay menu_padre_id
        }));

        // Construir la estructura jerárquica basada en menu_padre_id
        const menuMap = new Map<string, BackendManageMenuItem>();
        const rootMenus: BackendManageMenuItem[] = [];

        // Primero, crear un mapa de todos los menús
        menus.forEach(menu => {
          menuMap.set(menu.menu_id, { ...menu, children: [] });
        });

        // Luego, construir la jerarquía
        menus.forEach(menu => {
          const menuNode = menuMap.get(menu.menu_id)!;
          if (menu.padre_menu_id && menuMap.has(menu.padre_menu_id)) {
            const parent = menuMap.get(menu.padre_menu_id)!;
            parent.children.push(menuNode);
          } else {
            rootMenus.push(menuNode);
          }
        });

        if (import.meta.env.DEV) {
          console.log(`✅ [MenuService] Menús obtenidos para módulo ${moduloId}${seccionId ? ` y sección ${seccionId}` : ''}:`, {
            total: menus.length,
            rootMenus: rootMenus.length,
          });
        }

        return rootMenus;
      } else {
        console.error(`Respuesta inesperada de ${endpoint}:`, response.data);
        return [];
      }
    } catch (error) {
      console.error(`Error fetching menus for modulo ${moduloId} from ${endpoint}:`, error);
      throw error; // Lanzar error para que el componente lo maneje
    }
  },

  // --- Funciones Anteriores (Ajustadas) ---

  /**
   * Obtiene la estructura COMPLETA del árbol de menús (activos e inactivos).
   * Usado para gestión de permisos, etc. Llama a GET /menus/all-structured/
   * Devuelve una Promise que resuelve a BackendManageMenuItem[].
   */
  /**
   * Obtiene el árbol completo de menús (para mapeo menu_id → módulo en permisos).
   *
   * @param apiInstance - Instancia de Axios (tenant). Si no se pasa, se usa la por defecto (misma URL del tenant).
   */
  getFullMenuTree: async (apiInstance?: AxiosInstance): Promise<BackendManageMenuItem[]> => {
    const client = apiInstance ?? api;
    const endpoint = '/menus/all-structured/';
    try {
      const response = await client.get<MenuTreeResponse>(endpoint);
      if (response.data && Array.isArray(response.data.menu)) {
        return response.data.menu;
      }
      console.error(`Respuesta inesperada de ${endpoint}:`, response.data);
      return [];
    } catch (error) {
      console.error(`Error fetching full menu tree from ${endpoint}:`, error);
      return [];
    }
  },
};