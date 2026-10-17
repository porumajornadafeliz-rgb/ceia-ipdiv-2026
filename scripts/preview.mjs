/** Demonstração em memória, SOMENTE loopback. Nunca implantar como servidor real. */
import { createServer } from 'node:http';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { platform } from '../tests/platform.mjs';
const root = fileURLToPath(new URL('../', import.meta.url));
export function preview(port = 4173) {
  const app = platform();
  const server = createServer(async (req, res) => {
    res.setHeader('Cache-Control', 'no-store'); res.setHeader('Referrer-Policy', 'no-referrer');
    try {
      if (req.method === 'POST' && ['/api/public', '/api/admin'].includes(req.url)) {
        let raw = ''; for await (const chunk of req) { raw += chunk; if (raw.length > 16000) { res.writeHead(413); res.end(); return; } }
        const { action, input } = JSON.parse(raw);
        res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify(req.url.endsWith('admin') ? app.adminApi(action, input) : app.publicApi(action, input))); return;
      }
      if (req.method !== 'GET' || !['/', '/admin'].includes(req.url.split('?')[0])) { res.writeHead(404); res.end('Não encontrado'); return; }
      const admin = req.url.startsWith('/admin'), project = admin ? 'admin' : 'public';
      const event = JSON.parse(JSON.stringify(app.public.EVENT_));
      const config = JSON.stringify({ mode: project, event, open: true, url: 'http://127.0.0.1:' + server.address().port + '/', actor: { email: 'admin@example.test', role: 'admin' } });
      if (admin) app.setActor('admin@example.test');
      let html = readFileSync(path.join(root, 'dist', project, admin ? 'Admin.html' : 'Index.html'), 'utf8');
      html = html.replace(/<\?!= include_\('([^']+)'\); \?>/g, (_, name) => readFileSync(path.join(root, 'dist', project, name + '.html'), 'utf8'));
      html = html.replace('<?!= config ?>', config);
      html = html.replace('<body>', '<body><div class="demo-banner no-print">DEMONSTRAÇÃO LOCAL · Dados em memória, sem Google ou banco. Não faça pagamentos reais.</div><script>window.CEIA_DEMO = true;</script>');
      res.setHeader('Content-Type', 'text/html; charset=utf-8'); res.end(html);
    } catch (e) { res.writeHead(500); res.end('Falha na demonstração: ' + e.message); }
  });
  server.listen(port, '127.0.0.1'); return { server, app };
}
if (process.argv[1] === fileURLToPath(import.meta.url)) { const { server } = preview(Number(process.env.PORT || 4173)); server.on('listening', () => console.log('Demonstração local na porta ' + server.address().port + '. Sem persistência; nunca usar para inscrições reais.')); }
