import test from 'node:test';
import assert from 'node:assert/strict';
import { platform, registration } from './platform.mjs';
import qrcode from 'qrcode-generator';
import jsQR from 'jsqr';

function value(response) { assert.equal(response.ok, true, response.error); return response.data; }
function rejected(response, pattern) { assert.equal(response.ok, false); assert.match(response.error, pattern); }
function access(row) { return { id: row.id, token: row.token }; }
const empty = { adultMembers: 0, childMembers: 0, spouse: 0, adultGuests: 0, childGuests: 0 };

test('valores unitários de todas as categorias e regra dos filhos não membros', () => {
  const p = platform();
  for (const [key, price] of [['adultMembers', 8000], ['childMembers', 4000], ['adultGuests', 12000], ['childGuests', 6000]]) {
    const row = value(p.publicApi('create', registration({ counts: { ...empty, [key]: 1 } })));
    assert.equal(row.total, price); assert.equal(row.people, 1);
  }
  const family = value(p.publicApi('create', registration({ counts: { adultMembers: 1, childMembers: 2, spouse: 1, adultGuests: 2, childGuests: 3 } })));
  assert.equal(family.total, 66000); assert.equal(family.people, 9);
});

test('cônjuge requer membro adulto e permite apenas um', () => {
  const p = platform();
  rejected(p.publicApi('create', registration({ counts: { ...empty, spouse: 1 } })), /cônjuge/);
  rejected(p.publicApi('create', registration({ counts: { ...empty, adultMembers: 1, spouse: 2 } })), /cônjuge/);
  const row = value(p.publicApi('create', registration({ counts: { ...empty, adultMembers: 1, spouse: 1 } })));
  assert.equal(row.total, 16000);
});

test('servidor rejeita quantidades inválidas e recalcula valor ignorando preço do navegador', () => {
  const p = platform();
  for (const n of [-1, 1.5, '1', null, 101]) rejected(p.publicApi('create', registration({ counts: { ...empty, adultMembers: n } })), /Quantidade/);
  rejected(p.publicApi('create', registration({ counts: empty })), /pelo menos|de 1 a 100/);
  rejected(p.publicApi('create', registration({ counts: { ...empty, adultMembers: 1, free: 2 } })), /Categoria/);
  const r = value(p.publicApi('create', { ...registration(), total: 1, status: 'PAID' }));
  assert.equal(r.total, 8000); assert.equal(r.status, 'PENDING');
});

test('validação de responsável, telefone, tamanho e fórmulas em planilhas', () => {
  const p = platform();
  for (const name of ['', '=IMPORTXML("url")', '@SUM(1)', 'Jo\u0000se', 'x'.repeat(121)]) rejected(p.publicApi('create', registration({ name })), /nome|texto simples/);
  rejected(p.publicApi('create', registration({ phone: '123' })), /telefone/);
  rejected(p.publicApi('create', registration({ phone: '=37999991234' })), /WhatsApp/);
  value(p.publicApi('create', registration({ phone: '+55 (37) 99999-1234' })));
});

test('prazo: aceita todo o minuto 23h59 em Brasília e bloqueia às 00h00', () => {
  const p = platform({ now: '2026-12-21T02:59:59.999Z' });
  const input = registration(), row = value(p.publicApi('create', input));
  p.setTime('2026-12-21T03:00:00Z');
  rejected(p.publicApi('create', registration()), /prazo/);
  assert.equal(value(p.publicApi('create', input)).id, row.id, 'retry após prazo retorna o envio existente');
  value(p.publicApi('lookup', access(row)));
  value(p.adminApi('payment', { id: row.id, paid: true, note: 'Extrato teste' }));
  assert.equal(value(p.publicApi('lookup', access(row))).status, 'PAID');
});

test('envio repetido tem mesma inscrição e token; payload diferente não duplica', () => {
  const p = platform(), input = registration();
  const first = value(p.publicApi('create', input)), second = value(p.publicApi('create', input));
  assert.equal(first.id, second.id); assert.equal(first.token, second.token);
  rejected(p.publicApi('create', { ...input, name: 'Outra Pessoa' }), /outros dados/);
  assert.equal(value(p.adminApi('list')).rows.length, 1);
  const rows = p.public.readRows_(p.public.sheet_());
  assert.notEqual(rows[0].tokenHash, first.token); assert.equal(rows[0].tokenHash.length, 64);
});

test('links individuais exigem token correto e não expõem dados administrativos', () => {
  const p = platform(), row = value(p.publicApi('create', registration()));
  rejected(p.publicApi('lookup', { id: row.id, token: 'a'.repeat(43) }), /Link inválido/);
  rejected(p.publicApi('lookup', { id: 'qualquer', token: row.token }), /Link inválido/);
  const result = value(p.publicApi('lookup', access(row)));
  for (const name of ['phone', 'tokenHash', 'requestHash', 'payloadHash', 'paidBy', 'audit']) assert.equal(result[name], undefined);
  rejected(p.publicApi('list', {}), /Ação inválida/);
});

test('Pix: TLV, chave, valor exato, moeda, TxId e CRC conhecido; QR decodificado por biblioteca independente', () => {
  const p = platform(), row = value(p.publicApi('create', registration()));
  function tlv(text) { const out = {}; for (let i = 0; i < text.length;) { const tag = text.slice(i, i + 2), n = Number(text.slice(i + 2, i + 4)); assert.ok(n > 0); out[tag] = text.slice(i + 4, i + 4 + n); assert.equal(out[tag].length, n); i += n + 4; } return out; }
  const fields = tlv(row.pix); assert.equal(fields['00'], '01'); assert.equal(fields['54'], '80.00'); assert.equal(fields['53'], '986'); assert.equal(fields['58'], 'BR');
  assert.equal(tlv(fields['26'])['01'], '20896270000130'); assert.equal(tlv(fields['62'])['05'], row.id);
  assert.equal(p.public.crc16_('123456789'), '29B1');
  // CRC independente via polinômio longo.
  let crc = 0xffff; for (const byte of Buffer.from(row.pix.slice(0, -4))) { crc ^= byte * 256; for (let j = 0; j < 8; j++) crc = crc >= 32768 ? (crc * 2 ^ 0x1021) & 65535 : crc * 2; }
  assert.equal(fields['63'], crc.toString(16).toUpperCase().padStart(4, '0'));
  const qr = qrcode(0, 'M'); qr.addData(row.pix, 'Byte'); qr.make();
  const n = qr.getModuleCount(), scale = 6, width = (n + 8) * scale, pixels = new Uint8ClampedArray(width * width * 4).fill(255);
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) if (qr.isDark(y, x)) for (let dy = 0; dy < scale; dy++) for (let dx = 0; dx < scale; dx++) { const i = (((y + 4) * scale + dy) * width + (x + 4) * scale + dx) * 4; pixels[i] = pixels[i + 1] = pixels[i + 2] = 0; }
  assert.equal(jsQR(pixels, width, width)?.data, row.pix);
});

test('aviso de Pix jamais confirma pagamento, nem quando cliente envia PAID', () => {
  const p = platform(), row = value(p.publicApi('create', registration()));
  const report = value(p.publicApi('report', { ...access(row), status: 'PAID', paid: true }));
  assert.equal(report.status, 'PENDING'); assert.ok(report.reportedAt);
  assert.equal(value(p.publicApi('report', access(row))).reportedAt, report.reportedAt);
  rejected(p.publicApi('payment', { id: row.id, paid: true }), /Ação inválida/);
});

test('tesouraria confirma manualmente, histórico registra conta/data/referência; estorno antes da entrada', () => {
  const p = platform(), row = value(p.publicApi('create', registration()));
  rejected(p.adminApi('payment', { id: row.id, paid: true, note: '' }), /referência/);
  const paid = value(p.adminApi('payment', { id: row.id, paid: true, note: 'Extrato 17/10 12h — Itaú' }));
  assert.equal(paid.status, 'PAID'); assert.equal(paid.audit.length, 1); assert.equal(paid.paidBy, 'tesouraria@example.test'); assert.ok(paid.paidAt);
  assert.equal(value(p.publicApi('lookup', access(row))).pix, '');
  const again = value(p.adminApi('payment', { id: row.id, paid: true, note: 'Segundo clique' })); assert.equal(again.audit.length, 1);
  const reversed = value(p.adminApi('payment', { id: row.id, paid: false, note: 'Conferência corrigida' }));
  assert.equal(reversed.status, 'PENDING'); assert.equal(reversed.audit.length, 2);
});

test('check-in familiar de um clique, bloqueio de duplicado e de não pago', () => {
  const p = platform(), row = value(p.publicApi('create', registration({ counts: { ...empty, adultMembers: 4 } })));
  p.setActor('entrada@example.test'); rejected(p.adminApi('entry', { id: row.id }), /não autorizado/);
  p.setActor('tesouraria@example.test'); value(p.adminApi('payment', { id: row.id, paid: true, note: 'Extrato verificado' }));
  rejected(p.adminApi('entry', { id: row.id }), /não autorizado/);
  p.setActor('entrada@example.test'); const entered = value(p.adminApi('entry', { id: row.id })); assert.ok(entered.entryAt);
  rejected(p.adminApi('entry', { id: row.id }), /já registrada/);
  assert.equal(value(p.adminApi('list')).metrics.enteredPeople, 4);
  p.setActor('tesouraria@example.test'); rejected(p.adminApi('payment', { id: row.id, paid: false, note: 'Teste' }), /entrada registrada/);
});

test('exceção de entrada exclusiva do admin, com motivo; não muda pagamento', () => {
  const p = platform(), row = value(p.publicApi('create', registration()));
  p.setActor('entrada@example.test'); rejected(p.adminApi('entry', { id: row.id, reason: 'Liberar', role: 'admin' }), /não autorizado/);
  p.setActor('admin@example.test'); rejected(p.adminApi('entry', { id: row.id }), /motivo/);
  const result = value(p.adminApi('entry', { id: row.id, reason: 'Autorização presencial da organização' }));
  assert.equal(result.status, 'PENDING'); assert.equal(result.entryOverride, true); assert.equal(result.audit[0].action, 'ENTRY_OVERRIDE');
});

test('conta Google e lista permitida verificadas a cada chamada; identidade do navegador ignorada', () => {
  const p = platform(), row = value(p.publicApi('create', registration()));
  p.setActor(''); rejected(p.adminApi('list'), /Conta não identificada/);
  p.setActor('intruso@example.test'); rejected(p.adminApi('list'), /não autorizado/);
  p.setActor('entrada@example.test'); rejected(p.adminApi('payment', { id: row.id, paid: true, note: 'Teste', email: 'admin@example.test', role: 'admin' }), /não autorizado/);
  const list = value(p.adminApi('list')); assert.equal(list.rows[0].total, undefined); assert.equal(list.rows[0].audit, undefined); assert.equal(list.rows[0].tokenHash, undefined); assert.equal(list.metrics.received, undefined);
  p.properties.ADMIN_ACCOUNTS = '{}'; rejected(p.adminApi('list'), /não autorizado/);
});

test('canal administrativo rejeita assinatura alterada, expirada e chamadas anônimas', () => {
  const p = platform();
  rejected(p.bridge({ payload: '{}', signature: 'fake' }), /não autorizado/);
  const signed = p.signed('list', {}); signed.payload = signed.payload.replace('list', 'payment'); rejected(p.bridge(signed), /não autorizado/);
  rejected(p.bridge(p.signed('list', {}, { time: Date.now() + 1000000000 })), /expirada/);
  rejected(p.bridge({}), /não autorizado/);
});

test('replay de uma confirmação não reaplica pagamento após estorno', () => {
  const p = platform(), row = value(p.publicApi('create', registration()));
  const signed = p.signed('payment', { id: row.id, paid: true, note: 'Referência extrato' }); value(p.bridge(signed));
  value(p.adminApi('payment', { id: row.id, paid: false, note: 'Correção' }));
  assert.equal(value(p.bridge(signed)).status, 'PENDING');
});

test('contenção informa falha recuperável e não grava inscrição parcial', () => {
  const p = platform(); p.lock(true); rejected(p.publicApi('create', registration()), /Muitos acessos/); p.lock(false);
  assert.equal(value(p.adminApi('list')).rows.length, 0);
});

test('indicadores financeiros e de entrada refletem famílias e pessoas declaradas', () => {
  const p = platform();
  const a = value(p.publicApi('create', registration({ counts: { ...empty, adultMembers: 2 } })));
  value(p.publicApi('create', registration()));
  value(p.adminApi('payment', { id: a.id, paid: true, note: 'Extrato' }));
  p.setActor('entrada@example.test'); value(p.adminApi('entry', { id: a.id }));
  p.setActor('tesouraria@example.test'); const m = value(p.adminApi('list')).metrics;
  assert.deepEqual(m, { families: 2, people: 3, paidPeople: 2, pendingPeople: 1, received: 16000, pending: 8000, enteredFamilies: 1, enteredPeople: 2 });
});

test('comprovante opcional privado, idempotente e acessível só à tesouraria/admin; nunca confirma pagamento', () => {
  const p = platform(), row = value(p.publicApi('create', registration()));
  const pdf = Buffer.from('%PDF-1.4\nfixture de teste').toString('base64');
  rejected(p.publicApi('proof', { ...access(row), base64: Buffer.from('<script>').toString('base64') }), /Formato/);
  rejected(p.publicApi('proof', { ...access(row), token: 'x'.repeat(43), base64: pdf }), /Link inválido/);
  p.shareFolder(true); rejected(p.publicApi('proof', { ...access(row), base64: pdf }), /privada/); p.shareFolder(false);
  const result = value(p.publicApi('proof', { ...access(row), base64: pdf }));
  assert.ok(result.proofAt); assert.equal(result.status, 'PENDING'); assert.equal(result.proofId, undefined);
  value(p.publicApi('proof', { ...access(row), base64: pdf })); assert.equal(p.files.size, 1);
  const file = value(p.adminApi('getProof', { id: row.id })); assert.equal(file.base64, pdf); assert.equal(file.mime, 'application/pdf');
  p.setActor('entrada@example.test'); rejected(p.adminApi('getProof', { id: row.id }), /não autorizado/);
  assert.equal(value(p.adminApi('list')).rows[0].proofAt, undefined);
});

test('planilha ganha novas linhas ao ultrapassar sua grade inicial sem perder inscrições', () => {
  const p = platform(), sheet = p.sheets.get('Inscricoes'); sheet.maxRows = 2;
  const first = value(p.publicApi('create', registration()));
  const second = value(p.publicApi('create', registration()));
  assert.notEqual(first.id, second.id); assert.ok(sheet.getMaxRows() >= 3);
  assert.equal(value(p.adminApi('list')).rows.length, 2);
});

test('primeira configuração autoriza a conta Google informada e preserva listas existentes', () => {
  const p = platform();
  const existing = p.properties.ADMIN_ACCOUNTS;
  p.public.initializePublic_();
  assert.equal(p.properties.ADMIN_ACCOUNTS, existing);
  delete p.properties.ADMIN_ACCOUNTS;
  p.public.initializePublic_();
  const row = value(p.publicApi('create', registration()));
  p.setActor('porumajornadafeliz@gmail.com');
  assert.equal(value(p.adminApi('list')).actor.role, 'admin');
  assert.equal(value(p.adminApi('payment', { id: row.id, paid: true, note: 'Conferência de teste' })).status, 'PAID');
  p.setActor('intruso@example.test');
  rejected(p.adminApi('list'), /não autorizado/);
});
