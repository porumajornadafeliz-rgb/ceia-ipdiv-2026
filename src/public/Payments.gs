/** Pix estático e comprovantes privados. Nenhuma autodeclaração confirma recebimento. */
function paymentSignature_(id, until) {
  var secret = props_().getProperty('TOKEN_SECRET');
  if (!secret) fail_('Configuração de segurança indisponível.');
  return Utilities.base64EncodeWebSafe(Utilities.computeHmacSha256Signature('payment-only:' + id + ':' + until, secret)).replace(/=+$/, '');
}
function paymentAccess_(row) {
  if (!paymentOpen_(row)) return null;
  var until = Date.now() + 10 * 60000;
  return { id: row.id, until: until, grant: paymentSignature_(row.id, until) };
}
function authorizedPaymentRow_(rows, input) {
  if (!input || typeof input.id !== 'string' || !/^IPD26[A-F0-9]{16}$/.test(input.id)) fail_('Acesso à inscrição inválido. Consulte novamente sua inscrição.');
  var row = rows.find(function(item) { return item.id === input.id; });
  if (!row) fail_('Acesso à inscrição inválido. Consulte novamente sua inscrição.');
  if (typeof input.token === 'string' && /^[a-zA-Z0-9_-]{43}$/.test(input.token) && safeEqual_(row.tokenHash, digest_(input.token))) return { row: row, full: true };
  if (!Number.isSafeInteger(input.until) || input.until <= Date.now() || input.until > Date.now() + 10 * 60000 || typeof input.grant !== 'string' || !/^[a-zA-Z0-9_-]{43}$/.test(input.grant) || !safeEqual_(paymentSignature_(row.id, input.until), input.grant)) fail_('Acesso ao pagamento expirado ou inválido. Consulte novamente por nome e WhatsApp.');
  return { row: row, full: false };
}
function payableOptions_(row) {
  return payableGroups_(row).map(function(numbers) {
    var targets = numbers.map(function(n) { return partFor_(row,n); }), amount = targets.reduce(function(sum,p) { return sum+p.amount; },0);
    return { parts: numbers, amount: amount, dueDate: targets[targets.length-1].dueDate,
      pix: pix_(amount, row.id + (paymentParts_(row).length === 1 ? '' : 'P' + numbers.join(''))) };
  });
}
function paymentOptions_(row) {
  var parts = paymentParts_(row);
  return { id: row.id, people: row.people, total: row.total, paymentStatus: paymentState_(row),
    reservationStatus: reservationState_(row), reservationDeadline: EVENT_.deadline,
    proofSubmittedAt: row.proofAt || '', proofRejected: row.status === 'PROOF_REJECTED',
    payment: paymentOverview_(row), paymentOptions: payableOptions_(row),
    remindersEnabled: Boolean(row.paymentPlan && row.paymentPlan.remindersEnabled),
    canChangePlan: paymentOpen_(row) && !parts.some(function(p) { return p.proofId || partState_(p) === 'PAID'; }),
    pix: parts.length === 1 && paymentOpen_(row) && partState_(parts[0]) === 'PENDING' ? pix_(row.total,row.id) : '' };
}
function paymentDetails_(input) {
  return locked_(function() { return paymentOptions_(authorizedPaymentRow_(readRows_(sheet_()), input).row); });
}
function changePaymentPlan_(input) {
  return locked_(function() {
    var sheet = sheet_(), authorization = authorizedPaymentRow_(readRows_(sheet),input), row = authorization.row;
    assertPlanChange_(row);
    var plan = chosenSchedule_(row.total,input.plan), previous = row.paymentPlan;
    if (previous && previous.key === plan.key) return authorization.full ? publicRow_(row) : paymentOptions_(row);
    plan.remindersEnabled = Boolean(previous && previous.remindersEnabled); plan.reminderConsentAt = previous ? previous.reminderConsentAt || '' : '';
    row.paymentPlan = plan; row.audit.push({action:'PAYMENT_PLAN_SELECTED',by:'participante',at:plan.chosenAt,note:plan.label});
    writeRow_(sheet,row); return authorization.full ? publicRow_(row) : paymentOptions_(row);
  });
}
function reminderPreference_(input) {
  return locked_(function() {
    var sheet = sheet_(), auth = authorizedPaymentRow_(readRows_(sheet),input), row = auth.row;
    if (typeof input.enabled !== 'boolean' || (input.enabled && !auth.full)) fail_('Para ativar lembretes, use o acesso completo da inscrição.');
    var plan = ensurePaymentPlan_(row); plan.remindersEnabled = input.enabled;
    if (input.enabled) plan.reminderConsentAt = new Date().toISOString();
    row.audit.push({action:input.enabled ? 'REMINDERS_ENABLED':'REMINDERS_DISABLED',by:'participante',at:new Date().toISOString(),note:'Preferência de lembretes por WhatsApp.'});
    writeRow_(sheet,row); return auth.full ? publicRow_(row) : paymentOptions_(row);
  });
}
function proofFolder_() {
  var id = props_().getProperty('PROOF_FOLDER_ID');
  if (!id) fail_('O envio de comprovantes ainda não foi configurado. A organização precisa concluir a configuração.');
  var folder = DriveApp.getFolderById(id);
  if (folder.getSharingAccess() !== DriveApp.Access.PRIVATE || folder.getEditors().length || folder.getViewers().length) fail_('A pasta de comprovantes precisa estar restrita à conta proprietária.');
  return folder;
}
function proofInput_(input) {
  var extensions = { 'application/pdf': '.pdf', 'image/png': '.png', 'image/jpeg': '.jpg' };
  if (!input || !extensions[input.mime] || typeof input.data !== 'string' || input.data.length > 2796204 || input.data.length % 4 || !/^[A-Za-z0-9+/]+={0,2}$/.test(input.data)) fail_('Envie um PDF, PNG ou JPG de até 2 MB.');
  var bytes;
  try { bytes = Utilities.base64Decode(input.data); } catch (error) { fail_('Arquivo inválido. Selecione novamente o comprovante.'); }
  if (bytes.length < 8 || bytes.length > 2097152) fail_('Envie um PDF, PNG ou JPG de até 2 MB.');
  var start = bytes.slice(0, 8).map(function(value) { return value & 255; });
  var valid = input.mime === 'application/pdf' ? start.slice(0, 5).join(',') === '37,80,68,70,45' : input.mime === 'image/png' ? start.join(',') === '137,80,78,71,13,10,26,10' : start[0] === 255 && start[1] === 216 && start[2] === 255;
  if (!valid) fail_('O conteúdo do arquivo não corresponde a PDF, PNG ou JPG.');
  return { bytes: bytes, mime: input.mime, extension: extensions[input.mime], hash: digest_(input.data) };
}
function submitProof_(input) {
  var proof = proofInput_(input);
  return locked_(function() {
    var sheet = sheet_(), rows = readRows_(sheet), authorization = authorizedPaymentRow_(rows,input), row = authorization.row;
    if (!paymentOpen_(row)) fail_('Esta reserva está cancelada, expirada ou já confirmada e quitada. Consulte a situação antes de enviar.');
    ensurePaymentPlan_(row);
    var targets = proofTargets_(row,input), numbers = targets.map(function(p) { return p.number; });
    var previous = row.audit.find(function(entry) { return entry.action === 'PROOF_SUBMITTED' && entry.hash === proof.hash && entry.proofId === targets[0].proofId; });
    if (previous && targets.every(function(p) { return p.proofId === previous.proofId && p.status !== 'PROOF_REJECTED'; })) return authorization.full ? publicRow_(row) : paymentOptions_(row);
    if (targets.some(function(p) { return partState_(p) !== 'PENDING'; })) fail_('O comprovante desta parcela já está em conferência ou o pagamento foi confirmado.');
    if (row.audit.some(function(entry) { return entry.action === 'PROOF_SUBMITTED' && entry.hash === proof.hash && JSON.stringify(entry.parts || [1]) !== JSON.stringify(numbers); })) fail_('Este comprovante já foi usado em outras parcelas. Envie o comprovante correto para não contabilizar o mesmo pagamento duas vezes.');
    var method = input.method || 'PIX'; if (['PIX','DEPOSIT'].indexOf(method)<0) fail_('Escolha Pix ou depósito em conta.');
    var file = proofFolder_().createFile(Utilities.newBlob(proof.bytes,proof.mime,'comprovante-'+row.id+'-P'+numbers.join('-')+proof.extension));
    var now = new Date().toISOString();
    targets.forEach(function(p) { p.proofId=file.getId(); p.proofMime=proof.mime; p.proofAt=now; p.status='PROOF_SUBMITTED'; p.method=method; p.proofGroup=numbers; });
    syncPayment_(row);
    row.audit.push({action:'PROOF_SUBMITTED',by:'participante',at:now,hash:proof.hash,proofId:file.getId(),parts:numbers,amount:targets.reduce(function(sum,p){return sum+p.amount;},0),method:method,note:'Comprovante recebido; pagamento ainda não confirmado.'});
    try { writeRow_(sheet,row); }
    catch (error) {
      var referenced = true;
      try { referenced = readRows_(sheet).some(function(stored) { return paymentParts_(stored).some(function(p) { return p.proofId===file.getId(); }); }); } catch (ignored) {}
      if (!referenced) { try { file.setTrashed(true); } catch (ignored) {} }
      throw error;
    }
    return authorization.full ? publicRow_(row) : paymentOptions_(row);
  });
}
function proofVersion_(row,number) { var p=partFor_(row,number);return p.proofId ? digest_(p.proofId+':'+p.proofAt+':'+JSON.stringify(p.proofGroup || [p.number])) : ''; }
function administrativeProof_(row,actor,number) {
  assertRole_(actor,['admin','treasury']);
  var part=partFor_(row,number);if(!part.proofId) fail_('Nenhum comprovante foi enviado para esta parcela.');
  proofFolder_();var bytes=DriveApp.getFileById(part.proofId).getBlob().getBytes();
  if(bytes.length>2097152) fail_('O comprovante excede o limite permitido.');
  return {version:proofVersion_(row,part.number),mime:part.proofMime,data:Utilities.base64Encode(bytes),name:'comprovante-'+row.id+'-P'+(part.proofGroup || [part.number]).join('-')+(part.proofMime==='application/pdf'?'.pdf':part.proofMime==='image/png'?'.png':'.jpg')};
}
