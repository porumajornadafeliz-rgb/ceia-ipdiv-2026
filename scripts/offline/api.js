// Simulador exclusivo da demonstração offline. Inicia vazio e nunca é publicado no Apps Script.
const demoRows = [], demoRequests = new Map(), demoProofs = new Map(), demoGrants = new Map();
const demoStatusAttempts = new Map();
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
    paymentStatus: paymentState_(row), reservationStatus: reservationState_(row), proofSubmittedAt: row.proofAt || '', proofRejected: row.status === 'PROOF_REJECTED', paidAt: row.paidAt || '', reservationDeadline: EVENT_.deadline,
    pix: reservationState_(row) !== 'RESERVED' || paymentState_(row) !== 'PENDING' ? '' : 'DEMONSTRACAO IPDIV 2026 - SEM VALIDADE PARA PAGAMENTO', event: EVENT_ };
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
      else if (action === 'status') {
        const contact = contactInput_(input), key = Math.floor(Date.now() / 60000) + ':' + contact.phone;
        const attempts = demoStatusAttempts.get(key) || 0;
        if (attempts >= 8) fail_('Muitas consultas para este WhatsApp. Aguarde um minuto e tente novamente.');
        demoStatusAttempts.set(key, attempts + 1);
        result = statusResults_(demoRows, contact); const matched = demoRows.filter(r => statusName_(r.name) === statusName_(contact.name) && r.phone === contact.phone).slice(-20).reverse(); result.registrations.forEach((item,i) => { const row = matched[i]; if (reservationState_(row) === 'RESERVED') { const grant = demoToken(); demoGrants.set(grant, { id: row.id, until: Date.now()+600000 }); item.paymentAccess = { id: row.id, grant }; } });
      }
      else if (['paymentDetails', 'proof'].includes(action)) {
        const grant = demoGrants.get(input.grant), row = input.token ? demoAuthorizedRow(input) : demoRows.find(r => r.id === input.id && grant?.id === r.id && grant.until > Date.now());
        if (!row) fail_('Consulte novamente sua inscrição.');
        if (action === 'proof') {
          if (reservationState_(row) !== 'RESERVED' || paymentState_(row) === 'PAID') fail_('Reserva indisponível para envio.');
          if (!['application/pdf','image/png','image/jpeg'].includes(input.mime) || atob(input.data || '').length > 2097152) fail_('Envie PDF, PNG ou JPG de até 2 MB.');
          row.proofId = demoUuid(); row.proofMime = input.mime; row.proofAt = demoNow(); row.status = 'PROOF_SUBMITTED'; demoProofs.set(row.proofId, input.data);
          row.audit.push({ action:'PROOF_SUBMITTED', by:'participante', at:row.proofAt });
        }
        result = demoPublicRow(row); if (!input.token) for (const key of ['name','phone','counts','event']) delete result[key];
      }
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
        if (role === 'door') { delete metrics.declaredTotal; delete metrics.receivedTotal; delete metrics.pendingTotal; }
        result = { actor, metrics, capacity: demoCapacity(), rows: demoRows.map(r => adminRow_(r, actor)) };
      } else {
        const row = demoRows.find(r => r.id === input.id);
        if (!row) fail_('Inscrição não encontrada.');
        if (action === 'getProof') { assertRole_(actor, ['admin']); if (!row.proofId) fail_('Nenhum comprovante.'); return { ok:true, data: { version:row.proofId, mime:row.proofMime, data:demoProofs.get(row.proofId), name:'comprovante-demonstracao.pdf' } }; }
        if (action === 'payment') { assertRole_(actor, ['admin']); if (row.proofId && input.proofVersion !== row.proofId && paymentState_(row) !== 'PAID') fail_('O comprovante mudou. Baixe o arquivo atual.'); if (input.approved === true && !occupiesSeats_(row) && !row.cancelledAt) assertSeats_(demoCapacity(), row.people); paymentTransition_(row,actor,input.approved,demoNow(),input.note); }
        else if (action === 'entry') entryTransition_(row, actor, demoNow());
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
