/** Pix estático e comprovantes privados. Nenhuma autodeclaração confirma recebimento. */
function paymentSignature_(id, until) {
  var secret = props_().getProperty('TOKEN_SECRET');
  if (!secret) fail_('Configuração de segurança indisponível.');
  return Utilities.base64EncodeWebSafe(Utilities.computeHmacSha256Signature('payment-only:' + id + ':' + until, secret)).replace(/=+$/, '');
}
function paymentAccess_(row) {
  if (reservationState_(row) !== 'RESERVED' || paymentState_(row) === 'PAID') return null;
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
function paymentOptions_(row) {
  return { id: row.id, people: row.people, total: row.total, paymentStatus: paymentState_(row),
    reservationStatus: reservationState_(row), reservationDeadline: EVENT_.deadline,
    proofSubmittedAt: row.proofAt || '', proofRejected: row.status === 'PROOF_REJECTED',
    pix: reservationState_(row) === 'RESERVED' && paymentState_(row) === 'PENDING' ? pix_(row.total, row.id) : '' };
}
function paymentDetails_(input) {
  return locked_(function() { return paymentOptions_(authorizedPaymentRow_(readRows_(sheet_()), input).row); });
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
    var sheet = sheet_(), authorization = authorizedPaymentRow_(readRows_(sheet), input), row = authorization.row;
    if (reservationState_(row) !== 'RESERVED') fail_('Esta reserva está cancelada, expirada ou já confirmada. Consulte a situação antes de enviar.');
    var previous = row.audit.find(function(entry) { return entry.action === 'PROOF_SUBMITTED' && entry.hash === proof.hash && entry.proofId === row.proofId; });
    if (previous && row.status !== 'PROOF_REJECTED') return authorization.full ? publicRow_(row) : paymentOptions_(row);
    if (paymentState_(row) === 'PROOF_SUBMITTED') fail_('Seu comprovante já está aguardando conferência. Não precisa enviá-lo novamente.');
    var file = proofFolder_().createFile(Utilities.newBlob(proof.bytes, proof.mime, 'comprovante-' + row.id + proof.extension));
    row.proofId = file.getId(); row.proofMime = proof.mime; row.proofAt = new Date().toISOString(); row.status = 'PROOF_SUBMITTED';
    row.audit.push({ action: 'PROOF_SUBMITTED', by: 'participante', at: row.proofAt, hash: proof.hash, proofId: row.proofId, note: 'Comprovante recebido; pagamento ainda não confirmado.' });
    try { writeRow_(sheet, row); }
    catch (error) {
      // Uma falha no flush pode ocorrer depois da gravação: preservar o arquivo se já referenciado.
      var referenced = true;
      try { referenced = readRows_(sheet).some(function(stored) { return stored.proofId === file.getId(); }); } catch (ignored) {}
      if (!referenced) { try { file.setTrashed(true); } catch (ignored) {} }
      throw error;
    }
    return authorization.full ? publicRow_(row) : paymentOptions_(row);
  });
}
function proofVersion_(row) { return row.proofId ? digest_(row.proofId + ':' + row.proofAt) : ''; }
function administrativeProof_(row, actor) {
  assertRole_(actor, ['admin', 'treasury']);
  if (!row.proofId) fail_('Nenhum comprovante foi enviado para esta inscrição.');
  proofFolder_();
  var bytes = DriveApp.getFileById(row.proofId).getBlob().getBytes();
  if (bytes.length > 2097152) fail_('O comprovante excede o limite permitido.');
  return { version: proofVersion_(row), mime: row.proofMime, data: Utilities.base64Encode(bytes), name: 'comprovante-' + row.id + (row.proofMime === 'application/pdf' ? '.pdf' : row.proofMime === 'image/png' ? '.png' : '.jpg') };
}
