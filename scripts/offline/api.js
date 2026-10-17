// Simulador exclusivo da demonstração offline. Inicia vazio e nunca é publicado no Apps Script.
const demoRows = [], demoRequests = new Map();
const demoCapacity = () => capacity_(demoRows, DEMO_CAPACITY.limit);
const cloneDemo = value => JSON.parse(JSON.stringify(value));
const demoNow = () => new Date().toISOString();
function demoUuid() {
  if (crypto.randomUUID) return crypto.randomUUID();
  const b = crypto.getRandomValues(new Uint8Array(16)); b[6] = (b[6] & 15) | 64; b[8] = (b[8] & 63) | 128;
  const h = Array.from(b, n => n.toString(16).padStart(2, '0')).join('');
  return h.slice(0, 8) + '-' + h.slice(8, 12) + '-' + h.slice(12, 16) + '-' + h.slice(16, 20) + '-' + h.slice(20);
}
function demoToken() { return btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(32)))).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/, ''); }
function demoPublicRow(row) {
  return { id: row.id, name: row.name, phone: row.phone, counts: row.counts, people: row.people, total: row.total,
    status: registrationState_(row), createdAt: row.createdAt, reportedAt: row.reportedAt || '', entryAt: row.entryAt || '', cancelledAt: row.cancelledAt || '',
    pix: row.cancelledAt ? '' : 'DEMONSTRACAO IPDIV 2026 - SEM VALIDADE PARA PAGAMENTO', event: EVENT_ };
}
function demoCreate(input) {
  const valid = registrationInput_(input), payload = JSON.stringify([valid.name, valid.phone, valid.counts]);
  if (demoRequests.has(valid.requestId)) {
    const previous = demoRequests.get(valid.requestId);
    if (previous.payload !== payload) fail_('Este envio já foi recebido com outros dados.');
    return { ...demoPublicRow(previous.row), token: previous.row.token };
  }
  assertSeats_(demoCapacity(), valid.people);
  const row = { ...valid, id: 'IPD26' + demoUuid().replaceAll('-', '').slice(0, 16).toUpperCase(), token: demoToken(), createdAt: demoNow(), status: 'REGISTERED', audit: [] };
  demoRows.push(row); demoRequests.set(valid.requestId, { row, payload });
  return { ...demoPublicRow(row), token: row.token };
}
function demoAuthorizedRow(input) {
  const row = demoRows.find(r => r.id === input.id);
  if (!row || row.token !== input.token) fail_('Link de demonstração inválido. Ele funciona apenas enquanto esta análise estiver aberta.');
  return row;
}
function demoApi(mode, action, input = {}, role = 'admin') {
  try {
    let result;
    if (mode === 'public') {
      if (action === 'capacity') result = demoCapacity();
      else if (action === 'create') result = demoCreate(input);
      else if (['lookup', 'report', 'confirmation'].includes(action)) {
        const row = demoAuthorizedRow(input);
        if (action === 'report' && !row.reportedAt) row.reportedAt = demoNow();
        result = demoPublicRow(row);
      } else fail_('Ação inválida na demonstração.');
    } else {
      const actor = { email: 'demonstracao@exemplo.invalid', role };
      assertRole_(actor, ['admin', 'door']);
      if (action === 'list') {
        const metrics = metrics_(demoRows);
        if (role === 'door') delete metrics.declaredTotal;
        result = { actor, metrics, capacity: demoCapacity(), rows: demoRows.map(r => adminRow_(r, actor)) };
      } else {
        const row = demoRows.find(r => r.id === input.id);
        if (!row) fail_('Inscrição não encontrada.');
        if (action === 'entry') entryTransition_(row, actor, demoNow());
        else if (action === 'cancel') {
          assertRole_(actor, ['admin']);
          if (input.cancelled === false && row.cancelledAt) assertSeats_(demoCapacity(), row.people);
          cancellationTransition_(row, actor, input.cancelled, demoNow(), input.note);
        } else fail_('Ação inválida na demonstração.');
        result = adminRow_(row, actor);
      }
    }
    return cloneDemo({ ok: true, data: result });
  } catch (e) { return { ok: false, error: e.message || 'Falha na demonstração.' }; }
}
window.ceiaOfflineApi = demoApi;
const demoSession = new Map();
window.ceiaDemoSession = { getItem: key => demoSession.get(key) || null, setItem: (key, val) => demoSession.set(key, val), removeItem: key => demoSession.delete(key) };
