import test from 'node:test';
import assert from 'node:assert/strict';
import { platform, registration } from './platform.mjs';
const value = response => { assert.equal(response.ok, true, response.error); return response.data; };
const rejected = response => { assert.equal(response.ok, false); assert.match(response.error, /vaga|lotação/i); };
const access = row => ({ id: row.id, token: row.token });
const family = people => registration({ counts: { adultMembers: people, childMembers: 0, spouse: 0, adultGuests: 0, childGuests: 0 } });
const pay = (p, row, paid = true) => p.adminApi('payment', { id: row.id, paid, note: 'Extrato conferido no teste' });

test('lotação inicial: 200 pessoas; pendentes, avisos e comprovantes não ocupam vaga', () => {
  const p = platform();
  const start = value(p.publicApi('capacity'));
  assert.deepEqual(start, { configured: true, limit: 200, policy: 'PAID', used: 0, remaining: 200 });
  const row = value(p.publicApi('create', family(2)));
  value(p.publicApi('report', access(row)));
  value(p.publicApi('proof', { ...access(row), base64: Buffer.from('%PDF-1.4\nfixture').toString('base64') }));
  assert.equal(value(p.publicApi('capacity')).remaining, 200);
  assert.equal(value(p.publicApi('lookup', access(row))).status, 'PENDING');
  value(pay(p, row));
  assert.equal(value(p.publicApi('capacity')).remaining, 198);
  assert.equal(value(p.adminApi('list')).capacity.remaining, 198);
});

test('adultos e crianças de todas as categorias contam na capacidade; estorno devolve vagas', () => {
  const p = platform();
  const row = value(p.publicApi('create', registration({ counts: { adultMembers: 1, childMembers: 2, spouse: 1, adultGuests: 2, childGuests: 3 } })));
  value(pay(p, row)); assert.equal(value(p.publicApi('capacity')).remaining, 191);
  value(pay(p, row)); assert.equal(value(p.publicApi('capacity')).remaining, 191, 'confirmar novamente não desconta duas vezes');
  value(pay(p, row, false)); assert.equal(value(p.publicApi('capacity')).remaining, 200);
  assert.equal(value(p.publicApi('lookup', access(row))).status, 'PENDING');
});

test('última vaga: duas inscrições pendentes vistas antes da confirmação não causam excesso', () => {
  const p = platform(); p.properties.MAX_PARTICIPANTS = '1';
  const first = value(p.publicApi('create', family(1))), second = value(p.publicApi('create', family(1)));
  assert.equal(value(p.publicApi('capacity')).remaining, 1);
  value(pay(p, first));
  rejected(pay(p, second));
  const pending = value(p.publicApi('lookup', access(second)));
  assert.equal(pending.status, 'PENDING'); assert.equal(pending.paidAt, '');
  const admin = value(p.adminApi('list'));
  assert.equal(admin.metrics.paidPeople, 1); assert.equal(admin.rows.find(r => r.id === second.id).audit.length, 0);
  assert.equal(admin.capacity.remaining, 0);
});

test('família maior que as vagas restantes é recusada integralmente sem gravar pagamento parcial', () => {
  const p = platform(); p.properties.MAX_PARTICIPANTS = '3';
  const large = value(p.publicApi('create', family(3))), small = value(p.publicApi('create', family(1)));
  value(pay(p, small)); rejected(pay(p, large));
  assert.equal(value(p.publicApi('lookup', access(large))).status, 'PENDING');
  rejected(p.publicApi('create', family(3)));
  assert.equal(value(p.adminApi('list')).rows.length, 2);
  const exact = value(p.publicApi('create', family(2))); value(pay(p, exact));
  assert.equal(value(p.publicApi('capacity')).remaining, 0);
});

test('lotação esgotada bloqueia novo cadastro; consulta, aviso, retry e estorno continuam disponíveis', () => {
  const p = platform(); p.properties.MAX_PARTICIPANTS = '1';
  const input = family(1), row = value(p.publicApi('create', input));
  value(pay(p, row)); rejected(p.publicApi('create', family(1)));
  const retry = value(p.publicApi('create', input)); assert.equal(retry.id, row.id); assert.equal(retry.token, row.token);
  value(p.publicApi('report', access(row)));
  assert.equal(value(p.publicApi('lookup', access(row))).status, 'PAID');
  value(pay(p, row, false)); value(p.publicApi('create', family(1)));
});

test('limite ausente, inválido ou política desconhecida bloqueiam cadastro; retorno público só contém agregados', () => {
  const p = platform();
  for (const limit of ['', '0', '-2', '2.5', '200pessoas', '999999999999999999999']) {
    p.properties.MAX_PARTICIPANTS = limit;
    assert.equal(value(p.publicApi('capacity')).configured, false); rejected(p.publicApi('create', family(1)));
  }
  p.properties.MAX_PARTICIPANTS = '200'; p.properties.SEAT_POLICY = 'UNKNOWN';
  rejected(p.publicApi('create', family(1)));
  p.properties.SEAT_POLICY = 'PAID'; const row = value(p.publicApi('create', family(1)));
  assert.deepEqual(Object.keys(value(p.publicApi('capacity'))).sort(), ['configured', 'limit', 'policy', 'used', 'remaining'].sort());
  delete p.properties.MAX_PARTICIPANTS; rejected(pay(p, row));
  p.properties.MAX_PARTICIPANTS = '150'; p.public.initializePublic_();
  assert.equal(p.properties.MAX_PARTICIPANTS, '150', 'inicialização preserva a lotação previamente configurada');
});

test('liberação excepcional ocupa vaga física, não confirma pagamento e não é contada duas vezes', () => {
  const p = platform({ actor: 'admin@example.test' }); p.properties.MAX_PARTICIPANTS = '1';
  const first = value(p.publicApi('create', family(1))), second = value(p.publicApi('create', family(1)));
  value(p.adminApi('entry', { id: first.id, reason: 'Liberação presencial da organização' }));
  assert.equal(value(p.publicApi('capacity')).remaining, 0);
  assert.equal(value(p.publicApi('lookup', access(first))).status, 'PENDING');
  rejected(p.adminApi('entry', { id: second.id, reason: 'Não pode exceder lotação' }));
  rejected(pay(p, second)); value(pay(p, first));
  assert.equal(value(p.publicApi('capacity')).used, 1);
});

test('checagem da lotação participa do mesmo bloqueio que grava o pagamento', () => {
  const p = platform(); const row = value(p.publicApi('create', family(1)));
  p.lock(true); const blocked = pay(p, row); assert.equal(blocked.ok, false); assert.match(blocked.error, /Muitos acessos/);
  p.lock(false);
  assert.equal(value(p.publicApi('lookup', access(row))).status, 'PENDING');
  assert.equal(value(p.publicApi('capacity')).remaining, 200);
  value(pay(p, row)); assert.equal(value(p.publicApi('capacity')).remaining, 199);
});
