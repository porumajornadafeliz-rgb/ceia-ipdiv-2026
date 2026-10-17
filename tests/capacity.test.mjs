import test from 'node:test';
import assert from 'node:assert/strict';
import { platform, registration, pay } from './platform.mjs';
const value = response => { assert.equal(response.ok, true, response.error); return response.data; };
const rejected = response => { assert.equal(response.ok, false); assert.match(response.error, /vaga|lotação/i); };
const access = row => ({ id: row.id, token: row.token });
const family = people => registration({ counts: { adultMembers: people, childMembers: 0, spouse: 0, adultGuests: 0, childGuests: 0 } });
const cancel = (p, row, cancelled = true) => p.adminApi('cancel', { id: row.id, cancelled, note: 'Solicitação do responsável' });

test('lotação inicia em 200 e baixa imediatamente ao registrar, sem pagamento ou WhatsApp', () => {
  const p = platform();
  assert.deepEqual(value(p.publicApi('capacity')), { configured: true, limit: 200, policy: 'REGISTERED', used: 0, remaining: 200 });
  const row = value(p.publicApi('create', family(4)));
  assert.equal(value(p.publicApi('capacity')).remaining, 196);
  value(p.publicApi('report', access(row))); value(p.publicApi('report', access(row)));
  value(p.publicApi('confirmation', access(row))); value(p.publicApi('lookup', access(row)));
  assert.equal(value(p.publicApi('capacity')).remaining, 196, 'contato, cópia e consulta não descontam novamente');
});
test('adultos e crianças de todas as categorias ocupam lugares; cancelamento devolve os lugares', () => {
  const p = platform();
  const row = value(p.publicApi('create', registration({ counts: { adultMembers: 1, childMembers: 2, spouse: 1, adultGuests: 2, childGuests: 3 } })));
  assert.equal(value(p.publicApi('capacity')).remaining, 191);
  value(cancel(p, row)); value(cancel(p, row)); assert.equal(value(p.publicApi('capacity')).remaining, 200);
  value(cancel(p, row, false)); value(cancel(p, row, false)); assert.equal(value(p.publicApi('capacity')).remaining, 191);
});
test('última vaga: apenas o primeiro envio ocupa o lugar, mesmo com duas consultas anteriores', () => {
  const p = platform(); p.properties.MAX_PARTICIPANTS = '1';
  assert.equal(value(p.publicApi('capacity')).remaining, 1); assert.equal(value(p.publicApi('capacity')).remaining, 1);
  const input = family(1), row = value(p.publicApi('create', input));
  rejected(p.publicApi('create', family(1)));
  assert.equal(value(p.adminApi('list')).rows.length, 1); assert.equal(value(p.publicApi('capacity')).remaining, 0);
  assert.equal(value(p.publicApi('create', input)).id, row.id, 'retry é idempotente mesmo esgotado');
});
test('família acima das vagas restantes é recusada inteira, sem registro parcial', () => {
  const p = platform(); p.properties.MAX_PARTICIPANTS = '3';
  value(p.publicApi('create', family(1))); rejected(p.publicApi('create', family(3)));
  assert.equal(value(p.adminApi('list')).rows.length, 1); assert.equal(value(p.publicApi('capacity')).remaining, 2);
  value(p.publicApi('create', family(2))); assert.equal(value(p.publicApi('capacity')).remaining, 0);
});
test('lotação esgotada bloqueia novo cadastro, mas mantém consulta, contato e entrada dos inscritos', () => {
  const p = platform({ actor: 'admin@example.test' }); p.properties.MAX_PARTICIPANTS = '1';
  const row = value(p.publicApi('create', family(1)));
  rejected(p.publicApi('create', family(1))); value(p.publicApi('report', access(row))); value(p.publicApi('lookup', access(row)));
  (pay(p, row), value(p.adminApi('entry', { id: row.id }))); assert.equal(value(p.publicApi('capacity')).remaining, 0);
});
test('limite inválido bloqueia novas inscrições; estado público só contém agregados', () => {
  const p = platform();
  for (const limit of ['', '0', '-2', '2.5', '200pessoas', '999999999999999999999']) {
    p.properties.MAX_PARTICIPANTS = limit;
    assert.equal(value(p.publicApi('capacity')).configured, false); rejected(p.publicApi('create', family(1)));
  }
  p.properties.MAX_PARTICIPANTS = '200'; p.properties.SEAT_POLICY = 'PAID';
  value(p.publicApi('create', family(1))); assert.equal(value(p.publicApi('capacity')).remaining, 199, 'propriedade antiga não restaura a regra financeira');
  assert.deepEqual(Object.keys(value(p.publicApi('capacity'))).sort(), ['configured', 'limit', 'policy', 'used', 'remaining'].sort());
});
test('reativação respeita lotação e não ocupa duas vezes a vaga de outra família', () => {
  const p = platform(); p.properties.MAX_PARTICIPANTS = '1';
  const first = value(p.publicApi('create', family(1))); value(cancel(p, first));
  const second = value(p.publicApi('create', family(1)));
  rejected(cancel(p, first, false)); assert.equal(value(p.publicApi('lookup', access(first))).status, 'CANCELLED');
  value(cancel(p, second)); value(cancel(p, first, false)); assert.equal(value(p.publicApi('capacity')).used, 1);
});
test('bloqueio serializa cadastro e reativação sem escrita parcial', () => {
  const p = platform(), row = value(p.publicApi('create', family(1))); value(cancel(p, row));
  p.lock(true);
  assert.equal(p.publicApi('create', family(1)).ok, false); assert.equal(cancel(p, row, false).ok, false);
  p.lock(false); assert.equal(value(p.publicApi('capacity')).remaining, 200);
  value(cancel(p, row, false)); assert.equal(value(p.publicApi('capacity')).remaining, 199);
});
