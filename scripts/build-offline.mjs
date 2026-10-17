import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import vm from 'node:vm';
const root = fileURLToPath(new URL('../', import.meta.url));
const read = file => readFile(path.join(root, file), 'utf8');
const domain = await read('src/shared/Domain.gs');
const domainContext = vm.createContext({}); vm.runInContext(domain, domainContext);
const event = JSON.parse(JSON.stringify(domainContext.EVENT_));
const safeJson = data => JSON.stringify(data).replaceAll('<', '\\u003c');
const pages = {};
for (const [panel, project, role] of [['registration', 'public', 'admin'], ['treasury', 'admin', 'admin'], ['door', 'admin', 'door']]) {
  let html = await read(`dist/${project}/${project === 'public' ? 'Index' : 'Admin'}.html`);
  const includes = [...html.matchAll(/<\?!= include_\('([^']+)'\); \?>/g)];
  for (const match of includes) {
    const contents = await read(`dist/${project}/${match[1]}.html`);
    html = html.replace(match[0], () => contents);
  }
  html = html.replace('<?!= config ?>', safeJson({ event, open: true, mode: project, url: 'DEMONSTRACAO', actor: { email: 'demonstracao@exemplo.invalid', role } }));
  html = html.replace('<body>', '<body><script>window.CEIA_DEMO = true;</script>');
  html = html.replace('    if (window.CEIA_DEMO) {\n      fetch(', `    if (window.CEIA_DEMO) {\n      ok(parent.ceiaOfflineApi(CONFIG.mode, action, input, CONFIG.actor.role));\n    } else if (false) {\n      fetch(`);
  html = html.replaceAll('sessionStorage.', 'parent.ceiaDemoSession.');
  html = html.replace("if (window.CEIA_DEMO) history.replaceState(null, '', '#' + hash);", "if (window.CEIA_DEMO) { /* Link simulado válido apenas nesta análise. */ }");
  html = html.replace('Pague com Pix</h3>', 'Simulação do Pix</h3>')
    .replace('Escaneie o QR Code ou copie o código e cole na opção Pix Copia e Cola do seu banco.', 'Esta é uma demonstração. O QR Code e o texto abaixo não permitem fazer pagamentos.')
    .replace('COPIAR CÓDIGO PIX', 'COPIAR CÓDIGO DE DEMONSTRAÇÃO')
    .replace(/<div class="notice bank-details">[\s\S]*?<\/div>/, '<div class="notice bank-details"><strong>DEMONSTRAÇÃO — SEM COBRANÇA</strong><p>Nenhuma conta bancária é acionada. Para testar, avise que fez o Pix e simule a conferência na aba Tesouraria.</p></div>')
    .replace('Agora é só fazer o Pix e aguardar a conferência da tesouraria.', 'Simule o aviso de Pix e, na aba Tesouraria, confirme o pagamento fictício.')
    .replace('Este link é particular e dá acesso aos dados desta inscrição. Compartilhe somente com pessoas de confiança.', 'Este link de demonstração funciona apenas nesta análise aberta. A versão publicada terá um link individual protegido por token.')
    .replace('O arquivo ficará privado, disponível somente à tesouraria.', 'Nesta demonstração, o arquivo fica somente na memória desta aba e é descartado ao fechar.')
    .replace("return 'CEIA DE CONFRATERNIZAÇÃO 2026\\n", "return 'DEMONSTRAÇÃO — SEM VALIDADE PARA ENTRADA OU PAGAMENTO\\nCEIA DE CONFRATERNIZAÇÃO 2026\\n")
    .replace('id="share-receipt"', 'id="share-receipt" disabled title="Compartilhamento real disponível após a publicação no Google"');
  html = html.replace('</head>', '<style>@media print{body::before{content:"DEMONSTRAÇÃO — SEM VALIDADE PARA PAGAMENTO OU ENTRADA";display:block;font-weight:bold;padding:15px;border:2px solid #000}}</style></head>');
  pages[panel] = html;
}
const bridge = await read('src/public/Bridge.gs');
const adminProjection = bridge.slice(bridge.indexOf('function adminRow_('));
const apiSource = await read('scripts/offline/api.js');
const pageScript = `(() => {\n${domain}\n${adminProjection}\n${apiSource}\nconst pages = ${safeJson(pages)};\nconst frame = document.getElementById('app');\nconst registrationFrame = document.getElementById('registration-app');\nregistrationFrame.srcdoc = pages.registration;\nfunction selectPanel(panel) {\n document.querySelectorAll('[data-panel]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.panel === panel)));\n registrationFrame.hidden = panel !== 'registration'; frame.hidden = panel === 'registration';\n if (panel !== 'registration') frame.srcdoc = pages[panel];\n}\ndocument.querySelectorAll('[data-panel]').forEach(b => b.onclick = () => selectPanel(b.dataset.panel));\ndocument.getElementById('restart').onclick = () => { if (confirm('Apagar os dados de teste e reiniciar a análise?')) location.reload(); };\nselectPanel('registration');\n})();`;
const result = `<!DOCTYPE html>
<html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="referrer" content="no-referrer"><title>Análise do sistema — Ceia IPDiv 2026</title>
<style>*{box-sizing:border-box}body{margin:0;height:100vh;height:100dvh;display:flex;flex-direction:column;font:16px/1.4 system-ui,sans-serif;background:#f7f8f3;color:#143f32}header{padding:12px 20px;background:#fff2d8;border-bottom:1px solid #d6c79f}h1{font-size:19px;margin:0 0 5px}p{font-size:14px;margin:0 0 10px}nav{display:flex;flex-wrap:wrap;gap:8px}button{font:600 14px system-ui;min-height:44px;padding:10px 16px;border:1px solid #a9b8a5;border-radius:8px;background:#fff;color:#143f32;cursor:pointer}button[aria-pressed=true]{background:#143f32;color:#fff}button:focus-visible{outline:3px solid #8fa66c;outline-offset:2px}#restart{margin-left:auto;background:transparent}iframe{width:100%;flex:1;min-height:0;border:0;background:#f7f8f3}[hidden]{display:none!important}@media(max-width:560px){header{padding:10px}h1{font-size:17px}p{font-size:12px}button{font-size:12px;padding:10px}#restart{margin-left:0}}@media print{header{display:none}iframe{height:100vh}}</style></head>
<body><header><h1>Demonstração para análise · Ceia IPDiv 2026</h1><p>Teste as telas e os botões. Os dados são fictícios e ficam só nesta aba. Sem login Google, sem envio à planilha e sem pagamentos reais. Fechar ou recarregar apaga os testes.</p><nav aria-label="Áreas da demonstração"><button data-panel="registration" aria-pressed="true">1. INSCRIÇÃO</button><button data-panel="treasury" aria-pressed="false">2. TESOURARIA</button><button data-panel="door" aria-pressed="false">3. ENTRADA</button><button id="restart">REINICIAR ANÁLISE</button></nav></header><iframe id="registration-app" title="Página de inscrição para análise"></iframe><iframe id="app" title="Painel administrativo para análise" hidden></iframe><noscript>Abra este arquivo no Microsoft Edge ou Google Chrome com JavaScript habilitado.</noscript><script>${pageScript.replaceAll('</script', '<\\/script')}</script></body></html>`;
await mkdir(path.join(root, 'entrega'), { recursive: true });
await writeFile(path.join(root, 'entrega/ABRIR-DEMONSTRACAO.html'), result);
console.log('Criado entrega/ABRIR-DEMONSTRACAO.html — abre com dois cliques, sem instalação ou internet.');
