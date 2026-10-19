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
        if (actor.role === 'door') { delete metrics.declaredTotal; delete metrics.receivedTotal; delete metrics.pendingTotal; }
        return { actor: actor, rows: rows.map(function(r) { return adminRow_(r, actor); }), metrics: metrics, capacity: capacityForRows_(rows), reminders: actor.role === 'door' ? [] : remindersForAdmin_(rows,Date.now(),typeof ScriptApp !== 'undefined' ? ScriptApp.getService().getUrl() : '') };
      }
      var input = request.input;
      if (!input || typeof input.id !== 'string') fail_('Inscrição inválida.');
      var row = rows.find(function(r) { return r.id === input.id; });
      if (!row) fail_('Inscrição não encontrada.');
      if (request.action === 'getProof') return administrativeProof_(row, actor, input.part);
      // Nonce também fica na auditoria: nem um replay após remoção de cache repete alterações.
      if (row.audit.some(function(a) { return a.operation === request.nonce; })) return adminRow_(row, actor);
      var now = new Date().toISOString(), previousLength = row.audit.length;
      if (request.action === 'reminderOpened') {
        assertRole_(actor,['admin','treasury']);
        var candidate=remindersForAdmin_(rows,Date.now(),'').find(function(item) { return item.id===row.id && item.number===input.part; });
        if (!candidate) fail_('Este lembrete não está disponível. Atualize os dados.');
        if (!candidate.openedAt) row.audit.push({action:'REMINDER_OPENED',key:candidate.key,at:now,by:actor.email,note:'Conversa aberta; envio e entrega não comprovados.'});
      }
      else if (request.action === 'entry') entryTransition_(row, actor, now);
      else if (request.action === 'reservation') {
        assertRole_(actor, ['treasury','admin']);
        if (typeof input.confirmed !== 'boolean') fail_('Confirmação da vaga inválida.');
        if ((reservationState_(row) === 'CONFIRMED') !== input.confirmed && input.version !== reservationVersion_(row)) fail_('A inscrição mudou. Atualize os dados antes de marcar ou desmarcar a vaga.');
        if (input.confirmed && !occupiesSeats_(row) && !row.cancelledAt) assertSeats_(capacityForRows_(rows), row.people);
        reservationTransition_(row, actor, input.confirmed, now);
      }
      else if (request.action === 'payment') {
        assertRole_(actor, ['treasury', 'admin']);
        var part = partFor_(row,input.part);
        if (part.proofId && !(input.approved === true && partState_(part) === 'PAID') && !safeEqual_(proofVersion_(row,part.number), input.proofVersion || '')) fail_('O comprovante mudou. Atualize os dados, baixe e confira o arquivo atual antes de registrar a conferência.');
        paymentTransition_(row, actor, input.approved, now, input.note, part.number);
      }
      else if (request.action === 'cancel') {
        assertRole_(actor, ['treasury', 'admin']);
        if (input.cancelled === false && row.cancelledAt) assertSeats_(capacityForRows_(rows), row.people);
        cancellationTransition_(row, actor, input.cancelled, now, input.note);
      } else fail_('Ação inválida.');
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
  var out = { id: r.id, name: r.name, phone: r.phone, people: r.people, status: registrationState_(r),
    reservationStatus: reservationState_(r), paymentStatus: paymentState_(r), entryAt: r.entryAt || '', cancelledAt: r.cancelledAt || '' };
  if (actor.role !== 'door') {
    out.reservationVersion = reservationVersion_(r);
    out.payment = paymentOverview_(r); out.payment.parts.forEach(function(p) { var original=partFor_(r,p.number); p.hasProof=Boolean(original.proofId);p.paidBy=original.paidBy || ''; p.proofGroup=original.proofGroup || [p.number]; });
    out.total = r.total; out.counts = r.counts; out.createdAt = r.createdAt; out.reportedAt = r.reportedAt || ''; out.audit = r.audit;
    out.proofSubmittedAt = r.proofAt || ''; out.hasProof = Boolean(r.proofId); out.proofRejected = r.status === 'PROOF_REJECTED'; out.paidAt = r.paidAt || ''; out.paidBy = r.paidBy || '';
  }
  return out;
}
