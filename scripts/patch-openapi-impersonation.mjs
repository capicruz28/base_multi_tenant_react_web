import fs from 'fs';

const path = 'docs/backend_openapi.json';
const doc = JSON.parse(fs.readFileSync(path, 'utf8'));

doc.paths['/api/v1/auth/impersonate/{cliente_id}/'] = {
  post: {
    tags: ['Autenticación'],
    summary: 'Iniciar impersonación de cliente (platform_admin)',
    description:
      'Emite token de soporte temporal (TTL ~2h) sin refresh token. Misma respuesta que login: Schema A (selection_token) o Schema B (access_token). Claims JWT: is_impersonation, impersonated_by, impersonated_by_username (persisten tras POST /auth/empresa/seleccionar/).',
    operationId: 'auth_impersonate_cliente',
    parameters: [
      {
        name: 'cliente_id',
        in: 'path',
        required: true,
        schema: { type: 'string', format: 'uuid' },
      },
    ],
    responses: {
      '200': { description: 'Token impersonado o selección de empresa pendiente' },
      '401': { description: 'No autorizado' },
      '403': { description: 'Solo platform_admin' },
      '404': { description: 'Cliente no encontrado' },
    },
    security: [{ HTTPBearer: [] }],
  },
};

doc.paths['/api/v1/auth/impersonate/end/'] = {
  post: {
    tags: ['Autenticación'],
    summary: 'Finalizar impersonación',
    description:
      'Invalida sesión impersonada en servidor. El cliente debe restaurar la sesión plataforma desde sessionStorage.',
    operationId: 'auth_impersonate_end',
    responses: {
      '200': { description: 'Impersonación finalizada' },
      '401': { description: 'Token impersonado inválido o expirado' },
    },
    security: [{ HTTPBearer: [] }],
  },
};

fs.writeFileSync(path, JSON.stringify(doc));
console.log(
  'OpenAPI paths added:',
  Object.keys(doc.paths).filter((p) => p.includes('impersonate')),
);
