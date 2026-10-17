import { readFile, writeFile, mkdir, access, copyFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
const root = fileURLToPath(new URL('../', import.meta.url));
const read = name => readFile(path.join(root, name), 'utf8');
let brand = '<span class="brand-type">IPDiv<small>Igreja Presbiteriana<br>de Divinópolis</small></span>';
for (const [name, type] of [['logo.png', 'image/png'], ['logo.jpg', 'image/jpeg']]) {
  const file = path.join(root, 'assets', name);
  try {
    await access(file); const bytes = await readFile(file);
    brand = '<span class="official-logo-frame"><img class="official-logo" src="data:' + type + ';base64,' + bytes.toString('base64') + '" alt="Igreja Presbiteriana de Divinópolis"></span>'; break;
  } catch (e) { if (e.code !== 'ENOENT') throw e; }
}
const qrPath = path.join(root, 'node_modules/qrcode-generator/dist/qrcode.js');
const qr = '<script>\n' + (await readFile(qrPath, 'utf8')).replaceAll('</script', '<\\/script') + '\n</script>';
const pdfPath = path.join(root, 'node_modules/jspdf/dist/jspdf.umd.min.js');
const pdf = '<script>\n' + (await readFile(pdfPath, 'utf8')).replaceAll('</script', '<\\/script') + '\n</script>';
const commonManifest = { timeZone: 'America/Sao_Paulo', runtimeVersion: 'V8', exceptionLogging: 'STACKDRIVER' };
for (const project of ['public', 'admin']) {
  const out = path.join(root, 'dist', project); await mkdir(out, { recursive: true });
  await writeFile(path.join(out, 'appsscript.json'), JSON.stringify({ ...commonManifest,
    oauthScopes: project === 'public' ? ['https://www.googleapis.com/auth/spreadsheets', 'https://www.googleapis.com/auth/userinfo.email', 'https://www.googleapis.com/auth/drive'] : ['https://www.googleapis.com/auth/userinfo.email', 'https://www.googleapis.com/auth/script.external_request']
  }, null, 2) + '\n');
  for (const name of ['Domain.gs', 'Styles.html', 'Client.html']) await copyFile(path.join(root, 'src/shared', name), path.join(out, name));
  await writeFile(path.join(out, 'Brand.html'), brand);
  if (project === 'public') {
    await copyFile(path.join(root, 'src/shared/Storage.gs'), path.join(out, 'Storage.gs'));
    await copyFile(path.join(root, 'src/shared/Pix.gs'), path.join(out, 'Pix.gs'));
    for (const name of ['Config.gs', 'Public.gs', 'Payments.gs', 'Bridge.gs', 'Index.html', 'PublicClient.html']) await copyFile(path.join(root, 'src/public', name), path.join(out, name));
    await writeFile(path.join(out, 'Qr.html'), qr);
    await writeFile(path.join(out, 'Pdf.html'), pdf);
  } else for (const name of ['Admin.gs', 'Admin.html', 'AdminClient.html']) await copyFile(path.join(root, 'src/admin', name), path.join(out, name));
}
await mkdir(path.join(root, 'dist/licenses'), { recursive: true });
await copyFile(path.join(root, 'THIRD_PARTY_NOTICES.md'), path.join(root, 'dist/licenses/qrcode-generator.txt'));
await copyFile(path.join(root, 'node_modules/jspdf/LICENSE'), path.join(root, 'dist/licenses/jspdf.txt'));
console.log('Projetos gerados em dist/public e dist/admin. ' + (brand.includes('class="official-logo"') ? 'Logotipo oficial incorporado.' : 'Identidade textual: adicione o logotipo oficial em assets/logo.png e gere novamente.'));
