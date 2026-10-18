import test from 'node:test';
import assert from 'node:assert/strict';
import { platform, registration, pay } from './platform.mjs';
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
    assert.equal(row.total, price); assert.equal(row.people, 1); assert.equal(row.status, 'REGISTERED');
  }
  const family = value(p.publicApi('create', registration({ counts: { adultMembers: 1, childMembers: 2, spouse: 1, adultGuests: 2, childGuests: 3 } })));
  assert.equal(family.total, 66000); assert.equal(family.people, 9);
});
test('cônjuge requer membro adulto e permite apenas um', () => {
  const p = platform();
  rejected(p.publicApi('create', registration({ counts: { ...empty, spouse: 1 } })), /cônjuge/);
  rejected(p.publicApi('create', registration({ counts: { ...empty, adultMembers: 1, spouse: 2 } })), /cônjuge/);
  assert.equal(value(p.publicApi('create', registration({ counts: { ...empty, adultMembers: 1, spouse: 1 } }))).total, 16000);
});
test('quantidades inválidas são recusadas; total e status do navegador são ignorados', () => {
  const p = platform();
  for (const n of [-1, 1.5, '1', null, 101]) rejected(p.publicApi('create', registration({ counts: { ...empty, adultMembers: n } })), /Quantidade/);
  rejected(p.publicApi('create', registration({ counts: empty })), /de 1 a 100/);
  rejected(p.publicApi('create', registration({ counts: { ...empty, adultMembers: 1, free: 2 } })), /Categoria/);
  const r = value(p.publicApi('create', { ...registration(), total: 1, status: 'PAID' }));
  assert.equal(r.total, 8000); assert.equal(r.status, 'REGISTERED');
});
test('responsável, telefone brasileiro e fórmulas de planilha são validados', () => {
  const p = platform();
  for (const name of ['', '=IMPORTXML("url")', '@SUM(1)', 'Jo\u0000se', 'x'.repeat(121)]) rejected(p.publicApi('create', registration({ name })), /nome|texto simples/);
  rejected(p.publicApi('create', registration({ phone: '123' })), /telefone/);
  rejected(p.publicApi('create', registration({ phone: '=37999991234' })), /WhatsApp/);
  assert.equal(value(p.publicApi('create', registration({ phone: '+55 (37) 99999-1234' }))).phone, '37999991234');
});
test('prazo inclui 20/12 23h59 em Brasília; consultas e retry continuam após encerramento', () => {
  const p = platform({ now: '2026-12-21T02:59:59.999Z' });
  const input = registration(), row = value(p.publicApi('create', input));
  p.setTime('2026-12-21T03:00:00Z');
  rejected(p.publicApi('create', registration()), /prazo/);
  assert.equal(value(p.publicApi('create', input)).id, row.id);
  assert.equal(value(p.publicApi('lookup', access(row))).status, 'REGISTERED');
  assert.equal(value(p.publicApi('capacity')).remaining, 200);
  assert.equal(value(p.publicApi('lookup', access(row))).reservationStatus, 'EXPIRED');
});
test('repetir o envio retorna inscrição e token originais sem descontar novas vagas', () => {
  const p = platform(), input = registration();
  const first = value(p.publicApi('create', input)), second = value(p.publicApi('create', input));
  assert.equal(first.id, second.id); assert.equal(first.token, second.token);
  rejected(p.publicApi('create', { ...input, name: 'Outra Pessoa' }), /outros dados/);
  assert.equal(value(p.adminApi('list')).rows.length, 1);
  assert.equal(value(p.publicApi('capacity')).remaining, 199);
  const stored = p.public.readRows_(p.public.sheet_())[0];
  assert.notEqual(stored.tokenHash, first.token); assert.equal(stored.tokenHash.length, 64);
});
test('consulta individual exige token correto e não expõe metadados administrativos', () => {
  const p = platform(), row = value(p.publicApi('create', registration()));
  rejected(p.publicApi('lookup', { id: row.id, token: 'a'.repeat(43) }), /Link inválido/);
  rejected(p.publicApi('lookup', { id: 'qualquer', token: row.token }), /Link inválido/);
  const result = value(p.publicApi('lookup', access(row)));
  for (const name of ['tokenHash', 'requestHash', 'payloadHash', 'paidBy', 'audit', 'proofId']) assert.equal(result[name], undefined);
  assert.equal(value(p.publicApi('confirmation', access(row))).status, 'REGISTERED', 'link disponível sem pagamento');
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

test('abrir WhatsApp não altera vagas nem comprova envio ou pagamento', () => {
  const p = platform(), row = value(p.publicApi('create', registration()));
  const report = value(p.publicApi('report', { ...access(row), status: 'PAID', paid: true }));
  assert.equal(report.status, 'REGISTERED'); assert.ok(report.reportedAt);
  assert.equal(value(p.publicApi('report', access(row))).reportedAt, report.reportedAt);
  assert.equal(value(p.publicApi('capacity')).remaining, 199);
});
test('entrada familiar exige pagamento confirmado; duplicações continuam bloqueadas', () => {
  const p = platform({ actor: 'entrada@example.test' });
  const row = value(p.publicApi('create', registration({ counts: { ...empty, adultMembers: 4 } })));
  rejected(p.adminApi('entry', { id: row.id }), /pagamento/i); pay(p, row);
  assert.ok(value(p.adminApi('entry', { id: row.id })).entryAt);
  rejected(p.adminApi('entry', { id: row.id }), /já registrada/);
  assert.equal(value(p.adminApi('list')).metrics.enteredPeople, 4);
  assert.equal(value(p.publicApi('capacity')).remaining, 196, 'entrada não desconta lugares novamente');
});
test('cancelar e reativar exige conta autorizada, motivo e auditoria', () => {
  const p = platform(), row = value(p.publicApi('create', registration()));
  rejected(p.adminApi('cancel', { id: row.id, cancelled: true, note: '' }), /motivo/);
  assert.equal(value(p.adminApi('cancel', { id: row.id, cancelled: true, note: 'Desistência informada' })).status, 'CANCELLED');
  const cancelled = value(p.publicApi('lookup', access(row))); assert.equal(cancelled.pix, '');
  p.setActor('entrada@example.test');
  rejected(p.adminApi('entry', { id: row.id }), /cancelada/);
  rejected(p.adminApi('cancel', { id: row.id, cancelled: false, note: 'Teste', role: 'admin' }), /não autorizado/);
  p.setActor('admin@example.test');
  const restored = value(p.adminApi('cancel', { id: row.id, cancelled: false, note: 'Participação restabelecida' }));
  assert.equal(restored.status, 'REGISTERED'); assert.equal(restored.audit.length, 2); assert.equal(restored.audit[0].by, 'tesouraria@example.test');
});
test('inscrição com entrada registrada não pode ser cancelada', () => {
  const p = platform({ actor: 'admin@example.test' }), row = value(p.publicApi('create', registration()));
  pay(p, row); value(p.adminApi('entry', { id: row.id }));
  rejected(p.adminApi('cancel', { id: row.id, cancelled: true, note: 'Tentativa de cancelamento' }), /entrada registrada/);
});
test('conta Google e papéis são verificados no servidor; identidade enviada pelo cliente é ignorada', () => {
  const p = platform(), row = value(p.publicApi('create', registration()));
  p.setActor(''); rejected(p.adminApi('list'), /Conta não identificada/);
  p.setActor('intruso@example.test'); rejected(p.adminApi('list'), /não autorizado/);
  p.setActor('entrada@example.test');
  rejected(p.adminApi('cancel', { id: row.id, cancelled: true, note: 'Teste', email: 'admin@example.test', role: 'admin' }), /não autorizado/);
  const list = value(p.adminApi('list')); assert.equal(list.rows[0].total, undefined); assert.equal(list.rows[0].audit, undefined); assert.equal(list.metrics.declaredTotal, undefined);
  p.properties.ADMIN_ACCOUNTS = '{}'; rejected(p.adminApi('list'), /não autorizado/);
});
test('canal administrativo recusa assinatura alterada, expirada e chamadas anônimas', () => {
  const p = platform();
  rejected(p.bridge({ payload: '{}', signature: 'fake' }), /não autorizado/);
  const signed = p.signed('list', {}); signed.payload = signed.payload.replace('list', 'entry'); rejected(p.bridge(signed), /não autorizado/);
  rejected(p.bridge(p.signed('list', {}, { time: Date.now() + 1000000000 })), /expirada/);
  rejected(p.bridge({}), /não autorizado/);
});
test('replay de cancelamento não cancela novamente uma inscrição reativada', () => {
  const p = platform(), row = value(p.publicApi('create', registration()));
  const signed = p.signed('cancel', { id: row.id, cancelled: true, note: 'Desistência informada' }); value(p.bridge(signed));
  value(p.adminApi('cancel', { id: row.id, cancelled: false, note: 'Participação restabelecida' }));
  assert.equal(value(p.bridge(signed)).status, 'REGISTERED');
  assert.equal(value(p.publicApi('capacity')).remaining, 199);
});
test('contenção do bloqueio não grava inscrição parcial', () => {
  const p = platform(); p.lock(true); rejected(p.publicApi('create', registration()), /Muitos acessos/); p.lock(false);
  assert.equal(value(p.adminApi('list')).rows.length, 0); assert.equal(value(p.publicApi('capacity')).remaining, 200);
});
test('indicadores contam inscrições ativas, canceladas, pessoas e entradas com valores recebidos somente após conferência', () => {
  const p = platform({ actor: 'admin@example.test' });
  const a = value(p.publicApi('create', registration({ counts: { ...empty, adultMembers: 2 } })));
  const b = value(p.publicApi('create', registration())); value(p.adminApi('cancel', { id: b.id, cancelled: true, note: 'Desistência' }));
  pay(p, a); value(p.adminApi('entry', { id: a.id }));
  assert.deepEqual(value(p.adminApi('list')).metrics, { families: 1, people: 2, declaredTotal: 16000, enteredFamilies: 1, enteredPeople: 2, cancelledFamilies: 1, receivedTotal:16000, pendingTotal:0, confirmedFamilies:1, confirmedPeople:2, pendingFamilies:0, expiredFamilies:0 });
});
test('autodeclaração não confirma pagamento e comprovante ausente não pode ser baixado', () => {
  const p = platform(), row = value(p.publicApi('create', registration()));
  for (const action of ['payment', 'bankApproved']) rejected(p.publicApi(action, { ...access(row), paid: true }), /Ação inválida/);
  rejected(p.adminApi('payment', { id:row.id, paid:true }), /inválida/);
  rejected(p.adminApi('getProof', { id:row.id }), /Nenhum comprovante/);
});
test('planilha amplia a grade sem perder registros; primeira inicialização começa sem exemplos', () => {
  const p = platform(), sheet = p.sheets.get('Inscricoes');
  assert.equal(sheet.getLastRow(), 1); assert.equal(value(p.publicApi('capacity')).remaining, 200);
  sheet.maxRows = 2;
  const first = value(p.publicApi('create', registration())), second = value(p.publicApi('create', registration()));
  assert.notEqual(first.id, second.id); assert.ok(sheet.getMaxRows() >= 3);
  assert.equal(value(p.adminApi('list')).rows.length, 2);
});
test('migração preserva registros e históricos existentes, acrescenta cancelamento e ativa vagas por inscrição', () => {
  const p = platform(), row = value(p.publicApi('create', registration()));
  const sheet = p.sheets.get('Inscricoes');
  sheet.rows[0] = sheet.rows[0].slice(0,21); sheet.rows[1] = sheet.rows[1].slice(0,21);
  sheet.rows[1][7] = 'PAID'; sheet.rows[1][9] = '2026-10-17T12:00:00.000Z'; sheet.rows[1][17] = JSON.stringify([{ action: 'PAYMENT_CONFIRMED', by: 'conta@example.test' }]);
  const original = JSON.parse(JSON.stringify(sheet.rows));
  p.properties.SEAT_POLICY = 'PAID';
  const accounts = p.properties.ADMIN_ACCOUNTS, secret = p.properties.TOKEN_SECRET;
  p.public.initializePublic_();
  assert.equal(p.properties.SEAT_POLICY, 'REGISTERED'); assert.equal(p.properties.ADMIN_ACCOUNTS, accounts); assert.equal(p.properties.TOKEN_SECRET, secret);
  assert.deepEqual(sheet.rows[0].slice(0,21), original[0]); assert.deepEqual(sheet.rows[1].slice(0, 21), original[1]);
  assert.equal(sheet.rows[0][21], 'cancelledAt'); assert.equal(sheet.rows[0][22], 'paymentPlan');
  const migrated = value(p.publicApi('lookup', access(row))); assert.equal(migrated.status, 'REGISTERED'); assert.equal(migrated.pix, '', 'pagamento histórico não gera outro Pix');
  assert.equal(value(p.publicApi('capacity')).remaining, 199);
  delete p.properties.ADMIN_ACCOUNTS; p.public.initializePublic_();
  p.setActor('porumajornadafeliz@gmail.com'); assert.equal(value(p.adminApi('list')).actor.role, 'admin');
});
