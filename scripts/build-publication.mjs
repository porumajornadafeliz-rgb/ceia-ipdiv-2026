/** Gera cada projeto em um Code.gs, preservando integralmente os modelos HTML locais. */
import { readFile, writeFile, mkdir, copyFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('../', import.meta.url));
for (const project of ['public', 'admin']) {
  const input = path.join(root, 'dist', project), output = path.join(root, 'dist/publicacao', project === 'public' ? 'PUBLICO' : 'ADMINISTRACAO');
  await mkdir(output, { recursive: true });
  const names = project === 'public' ? ['Index', 'Styles', 'Brand', 'Client', 'Qr', 'Pdf', 'PublicClient'] : ['Admin', 'Styles', 'Brand', 'Client', 'AdminClient'];
  const html = {};
  for (const name of names) html[name] = await readFile(path.join(input, name + '.html'), 'utf8');
  const sources = project === 'public' ? ['Domain.gs', 'Pix.gs', 'Storage.gs', 'Config.gs', 'Public.gs', 'Bridge.gs'] : ['Domain.gs', 'Admin.gs'];
  let code = '// Ceia IPDiv 2026 — projeto ' + project + '. Gerado; não contém credenciais.\n';
  code += 'var PACKAGED_HTML_ = ' + JSON.stringify(html).replaceAll('\u2028', '\\u2028').replaceAll('\u2029', '\\u2029') + ';\n\n';
  for (const file of sources) {
    const text = await readFile(path.join(input, file), 'utf8');
    code += '// ' + file + '\n' + text + '\n';
  }
  code = code.replaceAll("HtmlService.createTemplateFromFile('Index')", 'HtmlService.createTemplate(PACKAGED_HTML_.Index)')
    .replaceAll("HtmlService.createTemplateFromFile('Admin')", 'HtmlService.createTemplate(PACKAGED_HTML_.Admin)')
    .replaceAll('HtmlService.createHtmlOutputFromFile(name)', 'HtmlService.createHtmlOutput(PACKAGED_HTML_[name])');
  await writeFile(path.join(output, 'Code.gs'), code);
  await copyFile(path.join(input, 'appsscript.json'), path.join(output, 'appsscript.json'));
  console.log('Publicação simplificada: dist/publicacao/' + (project === 'public' ? 'PUBLICO' : 'ADMINISTRACAO') + ' — Code.gs e manifesto.');
}
await copyFile(path.join(root, 'docs/COLOCAR-NO-AR.md'), path.join(root, 'dist/publicacao/COMECE-AQUI.txt'));
await copyFile(path.join(root, 'THIRD_PARTY_NOTICES.md'), path.join(root, 'dist/publicacao/LICENCAS.txt'));
