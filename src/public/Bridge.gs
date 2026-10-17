/** Canal servidor-servidor. O navegador nunca recebe a chave ou assinatura. */
function doPost(e) {
  var result = withErrors_(function() {
    if (!e || !e.postData || e.postData.contents.length > 12000) fail_('Requisição inválida.');
    var envelope;
    try { envelope = JSON.parse(e.postData.contents); } catch (err) { fail_('Requisição inválida.'); }
    var secret = props_().getProperty('ADMIN_BRIDGE_SECRET');
    if (!secret || typeof envelope.payload !== 'string' || typeof envelope.signature !== 'string') fail_('Acesso não autorizado.');
    var signature = Utilities.base64EncodeWebSafe(Utilities.computeHmacSha256Signature(envelope.payload, secret));
    if (!safeEqual_(signature, envelope.signature)) fail_('Acesso não autorizado.');
    var request = JSON.parse(envelope.payload);
    if (!Number.isSafeInteger(request.time) || Math.abs(Date.now() - request.time) > 60000 || !/^[a-f0-9-]{36}$/i.test(request.nonce || '')) fail_('Requisição expirada ou inválida.');
    var accounts;
    try { accounts = JSON.parse(props_().getProperty('ADMIN_ACCOUNTS') || '{}'); } catch (err) { fail_('Lista de contas administrativas inválida.'); }
    var email = typeof request.email === 'string' ? request.email.toLowerCase().trim() : '';
    var role = accounts[email];
    if (!email || ['admin', 'treasury', 'door'].indexOf(role) < 0) fail_('Acesso não autorizado. Conta Google fora da lista de contas permitidas.');
    var actor = { email: email, role: role };
    if (request.action === 'whoami') return actor;
    return locked_(function() {
      var sheet = sheet_(), rows = readRows_(sheet);
      if (request.action === 'list') {
        var metrics = metrics_(rows);
        if (actor.role === 'door') { delete metrics.received; delete metrics.pending; }
        return { actor: actor, rows: rows.map(function(r) { return adminRow_(r, actor); }), metrics: metrics, capacity: capacityForRows_(rows) };
      }
      var input = request.input;
      if (!input || typeof input.id !== 'string') fail_('Inscrição inválida.');
      var row = rows.find(function(r) { return r.id === input.id; });
      if (!row) fail_('Inscrição não encontrada.');
      // Nonce também fica na auditoria: nem um replay após remoção de cache repete alterações.
      if (row.audit.some(function(a) { return a.operation === request.nonce; })) return adminRow_(row, actor);
      if (request.action === 'getProof') {
        assertRole_(actor, ['treasury', 'admin']);
        if (!row.proofId) fail_('Não há comprovante nesta inscrição.');
        var blob = DriveApp.getFileById(row.proofId).getBlob();
        return { base64: Utilities.base64Encode(blob.getBytes()), mime: row.proofMime, name: row.id + (row.proofMime === 'application/pdf' ? '.pdf' : row.proofMime === 'image/png' ? '.png' : '.jpg') };
      }
      var now = new Date().toISOString(), previousLength = row.audit.length;
      // Na política de vagas por pagamento, conferir sob o mesmo lock da gravação.
      // A liberação excepcional de entrada também ocupa lugar, mesmo sem pagamento.
      var capacity = capacityForRows_(rows);
      if ((!capacity.configured || capacity.policy === 'PAID') && row.status !== 'PAID' && !row.entryAt &&
          ((request.action === 'payment' && input.paid === true) || request.action === 'entry')) assertSeats_(capacity, row.people);
      if (request.action === 'payment') paymentTransition_(row, actor, input.paid, now, input.note);
      else if (request.action === 'entry') entryTransition_(row, actor, now, input.reason);
      else fail_('Ação inválida.');
      if (row.audit.length > previousLength) {
        row.audit[row.audit.length - 1].operation = request.nonce;
        writeRow_(sheet, row); // Estado e histórico na mesma gravação, sob o mesmo lock.
      }
      return adminRow_(row, actor);
    });
  });
  return ContentService.createTextOutput(JSON.stringify(result)).setMimeType(ContentService.MimeType.JSON);
}
function adminRow_(r, actor) {
  var out = { id: r.id, name: r.name, phone: r.phone, people: r.people, status: r.status,
    entryAt: r.entryAt, entryOverride: r.entryOverride };
  if (actor.role !== 'door') {
    out.total = r.total; out.counts = r.counts; out.createdAt = r.createdAt; out.reportedAt = r.reportedAt;
    out.proofAt = r.proofAt; out.paidAt = r.paidAt; out.paidBy = r.paidBy; out.audit = r.audit;
  }
  return out;
}
