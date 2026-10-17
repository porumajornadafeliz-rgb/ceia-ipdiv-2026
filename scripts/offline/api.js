// Simulador exclusivo da demonstração offline. Nunca é copiado para Apps Script.
const demoRows = [], demoRequests = new Map();
const demoCapacity = () => capacity_(demoRows, DEMO_CAPACITY.limit, DEMO_CAPACITY.policy);
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
  return { id: row.id, name: row.name, counts: row.counts, people: row.people, total: row.total,
    status: row.status, reportedAt: row.reportedAt || '', proofAt: row.proofAt || '', paidAt: row.paidAt || '', entryAt: row.entryAt || '',
    pix: row.status === 'PAID' ? '' : 'DEMONSTRACAO IPDIV 2026 - SEM VALIDADE PARA PAGAMENTO', event: EVENT_ };
}
function demoCreate(input) {
  const valid = registrationInput_(input), payload = JSON.stringify([valid.name, valid.phone, valid.counts]);
  if (demoRequests.has(valid.requestId)) {
    const previous = demoRequests.get(valid.requestId);
    if (previous.payload !== payload) fail_('Este envio já foi recebido com outros dados.');
    return { ...demoPublicRow(previous.row), token: previous.row.token };
  }
  assertSeats_(demoCapacity(), valid.people);
  const row = { ...valid, id: 'IPD26' + demoUuid().replaceAll('-', '').slice(0, 16).toUpperCase(), token: demoToken(), createdAt: demoNow(), status: 'PENDING', audit: [] };
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
      else if (['lookup', 'report', 'proof'].includes(action)) {
        const row = demoAuthorizedRow(input);
        if (action === 'report' && !row.reportedAt) row.reportedAt = demoNow();
        if (action === 'proof' && !row.proofAt) {
          if (typeof input.base64 !== 'string' || input.base64.length > 1398104) fail_('Use arquivo de até 1 MB.');
          const bytes = atob(input.base64);
          const mime = bytes.startsWith('%PDF-') ? 'application/pdf' : bytes.startsWith('\x89PNG\r\n\x1a\n') ? 'image/png' : bytes.startsWith('\xff\xd8\xff') ? 'image/jpeg' : '';
          if (!mime) fail_('Use PDF, JPG ou PNG.');
          row.proofAt = demoNow(); row.proof = { base64: input.base64, mime, name: row.id + (mime === 'application/pdf' ? '.pdf' : mime === 'image/png' ? '.png' : '.jpg') };
        }
        result = demoPublicRow(row);
      } else fail_('Ação inválida na demonstração.');
    } else {
      const actor = { email: 'demonstracao@exemplo.invalid', role };
      assertRole_(actor, ['admin', 'door']);
      if (action === 'list') {
        const metrics = metrics_(demoRows);
        if (role === 'door') { delete metrics.received; delete metrics.pending; }
        result = { actor, metrics, capacity: demoCapacity(), rows: demoRows.map(r => adminRow_(r, actor)) };
      } else {
        const row = demoRows.find(r => r.id === input.id);
        if (!row) fail_('Inscrição não encontrada.');
        if (DEMO_CAPACITY.policy === 'PAID' && row.status !== 'PAID' && !row.entryAt && ((action === 'payment' && input.paid === true) || action === 'entry')) assertSeats_(demoCapacity(), row.people);
        if (action === 'payment') paymentTransition_(row, actor, input.paid, demoNow(), input.note);
        else if (action === 'entry') entryTransition_(row, actor, demoNow(), input.reason);
        else if (action === 'getProof') { assertRole_(actor, ['admin']); if (!row.proof) fail_('Sem comprovante.'); result = row.proof; }
        else fail_('Ação inválida na demonstração.');
        if (!result) result = adminRow_(row, actor);
      }
    }
    return cloneDemo({ ok: true, data: result });
  } catch (e) { return { ok: false, error: e.message || 'Falha na demonstração.' }; }
}
// Exemplos fictícios para permitir analisar o painel antes de cadastrar uma família.
for (const [name, people, paid, entered] of [['José da Silva (exemplo)', 4, true, false], ['Maria Oliveira (exemplo)', 2, true, true], ['João Pereira (exemplo)', 3, false, false]]) {
  const created = demoCreate({ name, phone: '(37) 99999-0000', requestId: demoUuid(), counts: { adultMembers: people, childMembers: 0, spouse: 0, adultGuests: 0, childGuests: 0 } });
  if (paid) demoApi('admin', 'payment', { id: created.id, paid: true, note: 'Exemplo fictício, sem transação bancária' });
  if (entered) demoApi('admin', 'entry', { id: created.id });
}
window.ceiaOfflineApi = demoApi;
const demoSession = new Map();
window.ceiaDemoSession = { getItem: key => demoSession.get(key) || null, setItem: (key, val) => demoSession.set(key, val), removeItem: key => demoSession.delete(key) };
