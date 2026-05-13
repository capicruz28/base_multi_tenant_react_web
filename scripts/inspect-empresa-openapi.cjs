const fs = require('fs');
const j = JSON.parse(fs.readFileSync('docs/backend_openapi.json', 'utf8'));
const s = j.components.schemas;
['EmpresaCreate', 'EmpresaRead', 'EmpresaUpdate'].forEach((name) => {
  const sch = s[name];
  if (!sch || !sch.properties) return;
  console.log('---', name, '---');
  Object.keys(sch.properties)
    .sort()
    .forEach((k) => {
      const p = sch.properties[k];
      const type = p.type || p.format || (p.$ref ? 'ref' : '?');
      const req = (sch.required || []).includes(k) ? ' *required' : '';
      console.log('  ', k, ':', type, req);
    });
  console.log('');
});
