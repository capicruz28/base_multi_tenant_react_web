# GUÍA DE VERIFICACIÓN - Sistema de Branding Dinámico

## Cómo Verificar que el Branding Está Funcionando

### 1. Componente de Debug

He agregado un componente `BrandingDebug` que aparece en la esquina inferior derecha (solo en desarrollo).

**Qué muestra:**
- Estado del branding (cargando, cargado, error)
- Información del cliente actual
- Colores primario y secundario con preview
- Valores de las variables CSS aplicadas
- URLs de logo y favicon

**Ubicación:** Esquina inferior derecha de la pantalla

### 2. Verificar en DevTools del Navegador

#### A. Inspeccionar Variables CSS

1. Abre DevTools (F12)
2. Ve a la pestaña **Elements/Elementos**
3. Selecciona el elemento `<html>` o `:root`
4. En el panel de estilos, busca las variables:
   - `--color-primary`
   - `--color-primary-rgb`
   - `--color-secondary`
   - `--color-secondary-rgb`

**Valores esperados:**
- `--color-primary`: Debe ser el HEX del backend (ej: `#1976D2`)
- `--color-primary-rgb`: Debe ser `25, 118, 210` (para el azul por defecto)
- Si el backend retorna otro color, estos valores deben cambiar

#### B. Verificar en Console

Abre la consola del navegador y busca estos mensajes:

```
🎨 [BrandingInitializer] Cargando branding para cliente: X
✅ Branding cargado exitosamente: { color_primario: '#...', ... }
✅ Colores de branding aplicados: { primary: '#...', ... }
🔍 Variables CSS aplicadas: { '--color-primary': '#...', ... }
```

### 3. Verificar Visualmente

#### Elementos que DEBEN usar el color primario:

**Sidebar (`NewSidebar.tsx`):**
- ✅ **Elementos activos del menú** - Fondo y texto deben usar color primario
- ✅ **Indicador de ruta activa** (barra vertical izquierda) - Debe ser color primario
- ✅ **Títulos de secciones** (ej: "Administración") - Debe ser color primario
- ✅ **Iconos de carga** - Debe ser color primario
- ✅ **Puntos indicadores** de items hijos activos - Debe ser color primario

**Header (`Header.tsx`):**
- ✅ **Links del breadcrumb** al hacer hover - Debe ser color primario
- ✅ **Breadcrumb activo** (último item) - Debe ser color primario
- ✅ **Avatar del usuario** (círculo con iniciales) - Fondo debe ser color primario
- ✅ **Link a administración** en menú desplegable - Debe ser color primario

**Login (`Login.tsx`):**
- ✅ **Botón "Iniciar Sesión"** - Fondo debe ser color primario
- ✅ **Focus en inputs** - Borde debe ser color primario

### 4. Probar con Diferentes Colores

Para verificar que funciona, puedes:

1. **Modificar temporalmente el backend** para retornar un color diferente
2. **O modificar temporalmente el store** para probar:

```typescript
// En src/stores/branding.store.ts, después de cargar:
setBranding({
  ...branding,
  color_primario: '#FF0000', // Rojo para prueba
  color_secundario: '#00FF00', // Verde para prueba
});
```

3. **Recargar la página** y verificar que los colores cambien

### 5. Verificar que las Clases Funcionan

**Problema común:** Si las clases `bg-brand-primary` no funcionan, puede ser porque:

1. **Tailwind no está procesando las variables correctamente**
   - Solución: Ya corregido - ahora usa `rgb(var(--color-primary-rgb))`

2. **Las variables CSS no se están aplicando**
   - Verificar en DevTools que `--color-primary-rgb` existe
   - Debe tener formato: `25, 118, 210` (sin `rgb()`)

3. **Cache de Tailwind**
   - Ejecutar: `npm run dev` para recompilar Tailwind

### 6. Checklist de Verificación

- [ ] El componente `BrandingDebug` aparece en la esquina inferior derecha
- [ ] Muestra "✅ Cargado" cuando hay branding
- [ ] Las variables CSS `--color-primary` y `--color-primary-rgb` tienen valores
- [ ] Los elementos activos del sidebar tienen el color primario
- [ ] El logo del sidebar se muestra (si existe `logo_url`)
- [ ] El favicon cambia (si existe `favicon_url`)
- [ ] Los botones primarios usan el color primario
- [ ] Los links hover usan el color primario

### 7. Solución de Problemas

#### Problema: No veo cambios de color

**Posibles causas:**
1. El branding no se está cargando
   - Verificar en console los logs
   - Verificar que el endpoint `/tenant/branding` responde correctamente
   - Verificar que el usuario tiene `clienteInfo` en `AuthContext`

2. Las variables CSS no se están aplicando
   - Verificar en DevTools que las variables existen en `:root`
   - Verificar que `applyBrandingColors()` se está ejecutando

3. Tailwind no está procesando las clases
   - Verificar que `tailwind.config.js` tiene la configuración correcta
   - Recompilar Tailwind: detener y reiniciar `npm run dev`

#### Problema: Las clases `bg-brand-primary/10` no funcionan

**Causa:** Tailwind necesita RGB para opacidad, no HEX

**Solución:** Ya implementada - ahora usa `rgb(var(--color-primary-rgb))`

#### Problema: El logo no aparece

**Verificar:**
1. Que `logo_url` tiene un valor válido en el backend
2. Que la URL es accesible (no bloqueada por CORS)
3. Que el componente tiene el fallback correcto

### 8. Respuesta a tu Pregunta

**¿La lista del sidebar tendría que tomar el color de color primario?**

**SÍ, correcto.** Los elementos activos del sidebar DEBEN usar el color primario para indicar:
- Qué página está activa
- Qué sección está seleccionada
- Mejor jerarquía visual

**Elementos que ya usan color primario:**
- ✅ Items de menú activos (fondo y texto)
- ✅ Barra indicadora izquierda de items activos
- ✅ Puntos indicadores de items hijos activos
- ✅ Títulos de secciones

**Si no ves el color primario aplicado:**
1. Verifica que el branding se está cargando (componente debug)
2. Verifica que las variables CSS están aplicadas (DevTools)
3. Verifica que las clases `brand-primary` están funcionando

---

## Próximos Pasos

1. **Abrir la aplicación en el navegador**
2. **Iniciar sesión**
3. **Verificar el componente de debug** (esquina inferior derecha)
4. **Abrir DevTools** y verificar variables CSS
5. **Navegar por el sidebar** y verificar que los items activos usan el color primario

Si después de esto no ves cambios, el problema puede estar en:
- El endpoint no está retornando branding
- El branding se está cargando pero no se está aplicando
- Las clases de Tailwind no están funcionando correctamente

