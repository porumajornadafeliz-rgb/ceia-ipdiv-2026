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
  secretariat: { phone: '(37) 3212-4980', whatsapp: '553732124980' },
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
function contactInput_(input) {
  if (!input || typeof input !== 'object') fail_('Dados inválidos.');
  var name = cleanText_(input.name, 120, 'o nome do responsável');
  if (name.length < 3) fail_('Informe o nome do responsável com pelo menos 3 letras.');
  if (typeof input.phone !== 'string' || /[^\d\s()+\-]/.test(input.phone)) fail_('Confira o WhatsApp com DDD.');
  var phone = input.phone.replace(/\D/g, '');
  if ((phone.length === 12 || phone.length === 13) && phone.indexOf('55') === 0) phone = phone.slice(2);
  if (!/^[1-9][0-9](?:[2-8][0-9]{7}|9[0-9]{8})$/.test(phone)) fail_('Informe um telefone brasileiro válido com DDD.');
  return { name: name, phone: phone };
}
function registrationInput_(input) {
  var contact = contactInput_(input);
  if (typeof input.requestId !== 'string' || !/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(input.requestId)) fail_('Atualize a página e tente novamente.');
  var calculated = calculate_(input.counts);
  return { name: contact.name, phone: contact.phone, counts: calculated.counts, people: calculated.people, total: calculated.total, requestId: input.requestId };
}
function statusName_(name) { return name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/\s+/g, ' ').trim(); }
/** Consulta limitada: nunca retorna contato, ID, token, valores ou dados administrativos. */
function statusResults_(rows, contact) {
  var name = statusName_(contact.name);
  var matches = rows.filter(function(row) { return statusName_(row.name) === name && row.phone === contact.phone; });
  return { more: matches.length > 20, registrations: matches.slice(-20).reverse().map(function(row) {
    return { status: registrationState_(row), people: row.people, createdAt: row.createdAt, entered: Boolean(row.entryAt) };
  }) };
}
function assertOpen_(now) {
  if (new Date(now).getTime() >= Date.parse(EVENT_.deadline)) fail_('O prazo de inscrições encerrou em 20/12/2026, às 23h59 (Brasília). A consulta continua disponível.');
}
/** Toda inscrição ativa ocupa lugares, independentemente do pagamento. */
function registrationState_(row) { return row.cancelledAt ? 'CANCELLED' : 'REGISTERED'; }
function capacity_(rows, limit) {
  var configured = Number.isSafeInteger(limit) && limit > 0;
  var used = rows.reduce(function(n, r) { return n + (r.cancelledAt ? 0 : r.people); }, 0);
  return { configured: configured, limit: configured ? limit : null, policy: 'REGISTERED',
    used: configured ? used : null, remaining: configured ? Math.max(0, limit - used) : null };
}
function assertSeats_(capacity, people) {
  if (!capacity.configured) fail_('O limite de vagas está em definição. Aguarde a organização liberar as inscrições.');
  if (people > capacity.remaining) fail_(capacity.remaining === 0 ? 'Vagas esgotadas. Procure a secretaria para orientação.' : 'Restam apenas ' + capacity.remaining + ' vaga(s). Não há lugar para todos os participantes desta inscrição.');
}
function assertRole_(actor, roles) {
  if (!actor || roles.indexOf(actor.role) < 0) fail_('Acesso não autorizado para esta ação.');
}
function cancellationTransition_(row, actor, cancelled, now, note) {
  assertRole_(actor, ['treasury', 'admin']);
  if (typeof cancelled !== 'boolean') fail_('Situação de inscrição inválida.');
  if (Boolean(row.cancelledAt) === cancelled) return false;
  if (row.entryAt) fail_('Uma inscrição com entrada registrada não pode ser cancelada.');
  var reason = cleanText_(note, 250, 'o motivo do cancelamento ou da reativação');
  row.cancelledAt = cancelled ? now : '';
  row.audit.push({ at: now, by: actor.email, action: cancelled ? 'REGISTRATION_CANCELLED' : 'REGISTRATION_RESTORED', note: reason });
  return true;
}
function entryTransition_(row, actor, now) {
  assertRole_(actor, ['door', 'admin']);
  if (row.cancelledAt) fail_('Inscrição cancelada. A entrada não está autorizada.');
  if (row.entryAt) fail_('Entrada já registrada em ' + row.entryAt + '.');
  row.entryAt = now; row.entryBy = actor.email; row.entryOverride = false;
  row.audit.push({ at: now, by: actor.email, action: 'ENTRY_CONFIRMED', note: '' });
}
function metrics_(rows) {
  return rows.reduce(function(m, r) {
    if (r.cancelledAt) { m.cancelledFamilies++; return m; }
    m.families++; m.people += r.people; m.declaredTotal += r.total;
    if (r.entryAt) { m.enteredFamilies++; m.enteredPeople += r.people; }
    return m;
  }, { families: 0, people: 0, declaredTotal: 0, enteredFamilies: 0, enteredPeople: 0, cancelledFamilies: 0 });
}
