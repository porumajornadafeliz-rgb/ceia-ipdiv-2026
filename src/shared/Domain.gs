/** Regras compartilhadas. Valores monetários sempre em centavos. */
var EVENT_ = Object.freeze({
  name: 'Ceia de Confraternização 2026',
  church: 'Igreja Presbiteriana de Divinópolis',
  date: '31/12/2026',
  venue: 'Salão Imperatriz',
  address: 'Rua Duarte, 70, Bairro Catalão, esquina com a Rua Paraná, Divinópolis, MG',
  thanksgiving: {
    name: 'Culto de Ações de Graças',
    time: '20h30min',
    venue: 'Templo da IPDiv',
    address: 'Av. Paraná, 1098 — Sidil, Divinópolis, MG'
  },
  mealTiming: 'Após o culto',
  deadline: '2026-12-21T03:00:00.000Z', // 21/12 00h00 em Brasília (UTC−3), limite exclusivo.
  categories: [
    { key: 'adultMembers', label: 'Adultos membros', price: 8000 },
    { key: 'childMembers', label: 'Crianças membros até 12 anos', price: 4000 },
    { key: 'spouse', label: 'Cônjuge adulto não-membro da igreja', price: 8000 },
    { key: 'adultGuests', label: 'Adultos não membros, incluindo filhos com 13 anos ou mais', price: 12000 },
    { key: 'childGuests', label: 'Crianças não membros até 12 anos', price: 6000 }
  ]
});

function fail_(message) { throw new Error(message); }
function cleanText_(value, max, label) {
  if (typeof value !== 'string') fail_('Informe ' + label + '.');
  var text = value.trim().replace(/\s+/g, ' ');
  if (!text || text.length > max || /[\u0000-\u001f\u007f]/.test(text)) fail_('Confira ' + label + '.');
  // Evita fórmulas ao gravar texto livre no Google Planilhas.
  if (/^[=+@\-]/.test(text)) fail_('Use texto simples em ' + label + '.');
  return text;
}
function calculate_(counts) {
  if (!counts || typeof counts !== 'object' || Array.isArray(counts)) fail_('Informe as quantidades.');
  if (Object.keys(counts).some(function(k) { return !EVENT_.categories.some(function(c) { return c.key === k; }); })) fail_('Categoria inválida.');
  var people = 0, total = 0, normalized = {};
  EVENT_.categories.forEach(function(c) {
    var n = counts[c.key];
    if (!Number.isInteger(n) || n < 0 || n > 100) fail_('Quantidade inválida em ' + c.label + '. Use de 0 a 100.');
    normalized[c.key] = n; people += n; total += n * c.price;
  });
  if (people < 1 || people > 100) fail_('A inscrição deve incluir de 1 a 100 pessoas. Para grupos maiores, faça outra inscrição.');
  if (normalized.spouse > 1 || (normalized.spouse && !normalized.adultMembers)) fail_('A tarifa especial permite um cônjuge e exige pelo menos um adulto membro.');
  return { counts: normalized, people: people, total: total };
}
function registrationInput_(input) {
  if (!input || typeof input !== 'object') fail_('Dados inválidos.');
  var name = cleanText_(input.name, 120, 'o nome do responsável');
  if (name.length < 3) fail_('Informe o nome do responsável com pelo menos 3 letras.');
  if (typeof input.phone !== 'string' || /[^\d\s()+\-]/.test(input.phone)) fail_('Confira o WhatsApp com DDD.');
  var phone = input.phone.replace(/\D/g, '');
  if ((phone.length === 12 || phone.length === 13) && phone.indexOf('55') === 0) phone = phone.slice(2);
  if (!/^[1-9][0-9](?:[2-8][0-9]{7}|9[0-9]{8})$/.test(phone)) fail_('Informe um telefone brasileiro válido com DDD.');
  if (typeof input.requestId !== 'string' || !/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(input.requestId)) fail_('Atualize a página e tente novamente.');
  var calculated = calculate_(input.counts);
  return { name: name, phone: phone, counts: calculated.counts, people: calculated.people, total: calculated.total, requestId: input.requestId };
}
function assertOpen_(now) {
  if (new Date(now).getTime() >= Date.parse(EVENT_.deadline)) fail_('O prazo de inscrições encerrou em 20/12/2026, às 23h59 (Brasília). A consulta continua disponível.');
}
function assertRole_(actor, roles) {
  if (!actor || roles.indexOf(actor.role) < 0) fail_('Acesso não autorizado para esta ação.');
}
function paymentTransition_(row, actor, paid, now, note) {
  assertRole_(actor, ['treasury', 'admin']);
  if (typeof paid !== 'boolean') fail_('Situação de pagamento inválida.');
  if (row.status === 'PAID' && paid) return false;
  if (row.status !== 'PAID' && !paid) return false;
  if (!paid && row.entryAt) fail_('Uma inscrição com entrada registrada não pode ter seu pagamento desfeito.');
  var reason = cleanText_(note, 250, 'a referência da conferência bancária ou motivo da alteração');
  row.status = paid ? 'PAID' : 'PENDING';
  row.paidAt = paid ? now : '';
  row.paidBy = paid ? actor.email : '';
  row.audit.push({ at: now, by: actor.email, action: paid ? 'PAYMENT_CONFIRMED' : 'PAYMENT_REVERSED', note: reason, amount: row.total });
  return true;
}
function entryTransition_(row, actor, now, overrideReason) {
  assertRole_(actor, ['door', 'admin']);
  if (row.entryAt) fail_('Entrada já registrada em ' + row.entryAt + '.');
  var override = row.status !== 'PAID';
  if (override) {
    assertRole_(actor, ['admin']);
    overrideReason = cleanText_(overrideReason, 250, 'o motivo da liberação excepcional');
  }
  row.entryAt = now;
  row.entryBy = actor.email;
  row.entryOverride = override;
  row.audit.push({ at: now, by: actor.email, action: override ? 'ENTRY_OVERRIDE' : 'ENTRY_CONFIRMED', note: override ? overrideReason : '' });
}
function metrics_(rows) {
  return rows.reduce(function(m, r) {
    m.families++; m.people += r.people;
    if (r.status === 'PAID') { m.paidPeople += r.people; m.received += r.total; }
    else { m.pendingPeople += r.people; m.pending += r.total; }
    if (r.entryAt) { m.enteredFamilies++; m.enteredPeople += r.people; }
    return m;
  }, { families: 0, people: 0, paidPeople: 0, pendingPeople: 0, received: 0, pending: 0, enteredFamilies: 0, enteredPeople: 0 });
}
