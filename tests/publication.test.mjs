import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';
import { platform, registration } from './platform.mjs';
// Também funciona após um checkout novo, sem depender de dist previamente gerado.
await import('../scripts/build.mjs');
await import('../scripts/build-publication.mjs');
const read = name => readFileSync(new URL('../' + name, import.meta.url), 'utf8');
const value = response => { assert.equal(response.ok, true, response.error); return response.data; };
function bundled() {
  const p = platform({ actor: 'admin@example.test' });
  vm.runInContext(read('dist/publicacao/PUBLICO/Code.gs'), p.public);
  vm.runInContext(read('dist/publicacao/ADMINISTRACAO/Code.gs'), p.admin);
  return p;
}
function htmlService(context) {
  const output = html => ({ html, getContent() { return this.html; }, setTitle() { return this; }, addMetaTag() { return this; } });
  return {
    createHtmlOutput: output,
    createTemplate: source => ({ config: '', evaluate() {
      context.config = this.config;
      try { return output(source.replace(/<\?!=\s*([\s\S]+?)\s*\?>/g, (_, expression) => vm.runInContext(expression.replace(/;\s*$/, ''), context))); }
      finally { delete context.config; }
    } })
  };
}

test('publicação consolidada preserva todos os modelos HTML e usa os mesmos arquivos de manifesto', () => {
  const p = bundled();
  for (const [project, context, directory] of [['public', p.public, 'PUBLICO'], ['admin', p.admin, 'ADMINISTRACAO']]) {
    for (const [name, html] of Object.entries(context.PACKAGED_HTML_)) assert.equal(html, read('dist/' + project + '/' + name + '.html'));
    assert.equal(read('dist/publicacao/' + directory + '/appsscript.json'), read('dist/' + project + '/appsscript.json'));
    const code = read('dist/publicacao/' + directory + '/Code.gs');
    assert.ok(!code.includes('createTemplateFromFile(')); assert.ok(!code.includes('createHtmlOutputFromFile('));
  }
});
test('Code.gs consolidado executa cadastro, baixa de vagas, cancelamento e entrada pelo canal real assinado', () => {
  const p = bundled();
  assert.equal(value(p.publicApi('capacity')).remaining, 200);
  const row = value(p.publicApi('create', registration()));
  assert.equal(value(p.publicApi('status', { name: row.name, phone: row.phone })).registrations[0].status, 'REGISTERED');
  assert.equal(value(p.publicApi('capacity')).remaining, 199);
  assert.equal(value(p.adminApi('list')).rows[0].id, row.id);
  value(p.adminApi('cancel', { id: row.id, cancelled: true, note: 'Teste de publicação' }));
  assert.equal(value(p.publicApi('capacity')).remaining, 200);
  value(p.adminApi('cancel', { id: row.id, cancelled: false, note: 'Retorno ao evento' }));
  p.setActor('entrada@example.test'); assert.ok(value(p.adminApi('entry', { id: row.id })).entryAt);
  assert.equal(value(p.publicApi('capacity')).remaining, 199);
});
test('páginas públicas e administrativas consolidadas renderizam marca, botões e configuração real', () => {
  const p = bundled();
  p.public.ScriptApp = { getService: () => ({ getUrl: () => 'https://script.google.com/macros/s/TEST/exec' }) };
  p.public.HtmlService = htmlService(p.public); p.admin.HtmlService = htmlService(p.admin);
  const publicHtml = p.public.doGet().getContent(), adminHtml = p.admin.doGet().getContent();
  for (const html of [publicHtml, adminHtml]) { assert.ok(html.includes('data:image/png;base64,')); assert.ok(!html.includes('<?!=')); assert.ok(!html.includes('test-secret-never-production')); assert.ok(!html.includes('bridge-test-never-production')); }
  assert.match(publicHtml, /REGISTRAR MINHA INSCRIÇÃO/); assert.match(adminHtml, /Inscrições e vagas/);
  assert.match(publicHtml, /"url":"https:\/\/script.google.com\/macros\/s\/TEST\/exec"/);
});
test('configuração inicial cria uma planilha sem exemplos e reutiliza a planilha em novas execuções', () => {
  const p = bundled(); delete p.properties.SPREADSHEET_ID; p.sheets.clear(); p.public.console = { log() {} };
  const result = JSON.parse(JSON.stringify(p.public.prepararPublicacao_()));
  assert.deepEqual(result, { planilha: 'https://docs.google.com/spreadsheets/d/test-sheet/edit', inscricoesAtivas: 0, limite: 200, vagasRestantes: 200 });
  assert.equal(p.createdSpreadsheets(), 1);
  const secret = p.properties.TOKEN_SECRET;
  value(p.publicApi('create', registration()));
  assert.equal(p.public.prepararPublicacao_().vagasRestantes, 199);
  assert.equal(p.createdSpreadsheets(), 1); assert.equal(p.properties.TOKEN_SECRET, secret);
  assert.equal(p.publicApi('prepararPublicacao', {}).ok, false);
});
test('configuração respeita bloqueio e não cria planilhas duplicadas em contenção', () => {
  const p = bundled(); delete p.properties.SPREADSHEET_ID; p.lock(true);
  assert.throws(() => p.public.prepararPublicacao_(), /Muitos acessos/); assert.equal(p.createdSpreadsheets(), 0);
  p.lock(false); p.public.console = { log() {} }; p.public.prepararPublicacao_(); assert.equal(p.createdSpreadsheets(), 1);
});

test('função de configuração visível bloqueia visitantes e confere conta e proprietário antes de qualquer alteração', () => {
  const p = bundled(); delete p.properties.SPREADSHEET_ID; p.public.console = { log() {} };
  for (const [user, owner] of [
    ['', 'porumajornadafeliz@gmail.com'],
    ['intruso@example.test', 'porumajornadafeliz@gmail.com'],
    ['porumajornadafeliz@gmail.com', 'outro@example.test']
  ]) {
    p.setPublicIdentity(user, owner);
    assert.throws(() => p.public.prepararPublicacao(), /conta proprietária/);
    assert.equal(p.createdSpreadsheets(), 0); assert.equal(p.properties.SPREADSHEET_ID, undefined);
  }
  p.setPublicIdentity('porumajornadafeliz@gmail.com');
  assert.equal(p.public.prepararPublicacao().vagasRestantes, 200);
  assert.equal(p.createdSpreadsheets(), 1);
  assert.equal(p.public.prepararPublicacao().vagasRestantes, 200);
  assert.equal(p.createdSpreadsheets(), 1);
  const code = read('dist/publicacao/PUBLICO/Code.gs');
  assert.match(code, /^function prepararPublicacao\(\)/m);
  const manifest = JSON.parse(read('dist/publicacao/PUBLICO/appsscript.json'));
  assert.ok(manifest.oauthScopes.includes('https://www.googleapis.com/auth/userinfo.email'));
});
