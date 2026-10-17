import test from 'node:test';
import assert from 'node:assert/strict';
import { platform, registration } from './platform.mjs';
const value = response => { assert.equal(response.ok, true, response.error); return response.data; };
const contact = { name: 'José da Silva', phone: '(37) 99999-1234' };

test('situação sem link exige nome completo e telefone, aceita acentos, caixa, espaços e DDI', () => {
  const p = platform(); value(p.publicApi('create', registration()));
  const response = value(p.publicApi('status', { name: '  JOSE   DA SILVA ', phone: '+55 (37) 99999-1234' }));
  assert.equal(response.registrations[0].status, 'REGISTERED');
  assert.equal(response.registrations[0].people, 1);
  for (const input of [{ ...contact, name: 'José' }, { ...contact, name: 'Outra Pessoa' }, { ...contact, phone: '(37) 99999-4321' }]) {
    assert.deepEqual(value(p.publicApi('status', input)).registrations, []);
  }
});
test('situação não libera token, link, ID, nome, telefone, valores, categorias ou histórico', () => {
  const p = platform(), row = value(p.publicApi('create', registration()));
  const response = value(p.publicApi('status', { ...contact, id: row.id, token: row.token }));
  assert.deepEqual(Object.keys(response).sort(), ['more', 'registrations']);
  assert.deepEqual(Object.keys(response.registrations[0]).sort(), ['createdAt', 'entered', 'people', 'status']);
  const serialized = JSON.stringify(response);
  for (const secret of [row.id, row.token, row.name, row.phone, row.pix]) assert.ok(!serialized.includes(secret));
  assert.equal(p.publicApi('lookup', contact).ok, false, 'Dados completos continuam exigindo token');
  assert.equal(p.publicApi('report', contact).ok, false);
});
test('consultar situação não modifica vagas, registros ou auditoria; acompanha cancelamento e entrada', () => {
  const p = platform(), row = value(p.publicApi('create', registration()));
  const before = JSON.stringify(p.public.readRows_(p.public.sheet_()));
  value(p.publicApi('status', contact));
  assert.equal(JSON.stringify(p.public.readRows_(p.public.sheet_())), before);
  assert.equal(value(p.publicApi('capacity')).remaining, 199);
  value(p.adminApi('cancel', { id: row.id, cancelled: true, note: 'Teste de consulta' }));
  assert.equal(value(p.publicApi('status', contact)).registrations[0].status, 'CANCELLED');
  assert.equal(value(p.publicApi('capacity')).remaining, 200);
  value(p.adminApi('cancel', { id: row.id, cancelled: false, note: 'Reativação para teste' }));
  p.setActor('entrada@example.test'); value(p.adminApi('entry', { id: row.id }));
  assert.equal(value(p.publicApi('status', contact)).registrations[0].entered, true);
  assert.equal(value(p.publicApi('capacity')).remaining, 199);
});
test('consulta de situação continua após prazo e lotação, sem liberar novo cadastro', () => {
  const p = platform(); p.properties.MAX_PARTICIPANTS = '1';
  value(p.publicApi('create', registration())); p.setTime('2026-12-21T03:00:00Z');
  assert.equal(value(p.publicApi('status', contact)).registrations[0].status, 'REGISTERED');
  assert.equal(p.publicApi('create', registration()).ok, false);
});
test('consulta trata nomes/telefones inválidos sem permitir busca parcial ou por telefone sozinho', () => {
  const p = platform(); value(p.publicApi('create', registration()));
  for (const input of [null, {}, { phone: contact.phone }, { name: contact.name }, { ...contact, phone: '123' }, { ...contact, name: '=SUM(1)' }, { ...contact, name: 'J\u0000ose' }, { ...contact, name: 'J'.repeat(121) }]) {
    assert.equal(p.publicApi('status', input).ok, false);
  }
  assert.deepEqual(value(p.publicApi('status', { ...contact, name: 'José da' })).registrations, []);
});
test('limite de consultas considera o telefone mesmo variando nomes e libera na janela seguinte', () => {
  const p = platform(); value(p.publicApi('create', registration()));
  for (let n = 0; n < 8; n++) value(p.publicApi('status', { ...contact, name: 'Tentativa ' + n }));
  const rejected = p.publicApi('status', contact);
  assert.equal(rejected.ok, false); assert.match(rejected.error, /Aguarde um minuto/);
  assert.equal(value(p.publicApi('status', { ...contact, phone: '(37) 99999-4321' })).registrations.length, 0);
  p.setTime('2026-10-17T15:01:01Z');
  assert.equal(value(p.publicApi('status', contact)).registrations.length, 1);
  p.lock(true); assert.match(p.publicApi('status', contact).error, /Muitos acessos/);
});
test('mesmos contatos podem ter várias inscrições; resultado limitado às 20 mais recentes', () => {
  const p = platform();
  for (let n = 0; n < 23; n++) {
    p.setTime('2026-10-17T15:' + String(n).padStart(2, '0') + ':00Z');
    value(p.publicApi('create', registration()));
  }
  const response = value(p.publicApi('status', contact));
  assert.equal(response.more, true); assert.equal(response.registrations.length, 20);
  assert.equal(response.registrations[0].createdAt, '2026-10-17T15:22:00.000Z');
  assert.equal(response.registrations[19].createdAt, '2026-10-17T15:03:00.000Z');
  assert.equal(value(p.publicApi('capacity')).remaining, 177);
});
