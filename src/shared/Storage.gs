var HEADERS_ = ['id', 'createdAt', 'name', 'phone', 'counts', 'people', 'total', 'status', 'reportedAt', 'paidAt', 'paidBy', 'entryAt', 'entryBy', 'entryOverride', 'tokenHash', 'requestHash', 'payloadHash', 'audit', 'proofId', 'proofMime', 'proofAt', 'cancelledAt', 'paymentPlan'];
function props_() { return PropertiesService.getScriptProperties(); }
function capacityForRows_(rows) {
  var p = props_(), raw = p.getProperty('MAX_PARTICIPANTS') || '';
  // Rejeitar valores parciais, decimais ou vazios; não assumir uma lotação.
  var limit = /^[1-9][0-9]*$/.test(raw) ? Number(raw) : null;
  return capacity_(rows, limit);
}
function spreadsheet_() {
  var id = props_().getProperty('SPREADSHEET_ID');
  if (!id) fail_('Configuração indisponível. Procure a organização da Igreja.');
  return SpreadsheetApp.openById(id);
}
function sheet_() {
  var sheet = spreadsheet_().getSheetByName('Inscricoes');
  if (!sheet) fail_('Planilha não inicializada. Procure a organização.');
  var headers = sheet.getRange(1, 1, 1, HEADERS_.length).getValues()[0];
  if (JSON.stringify(headers) !== JSON.stringify(HEADERS_)) fail_('A estrutura da planilha foi alterada. Procure a organização.');
  return sheet;
}
function readRows_(sheet) {
  if (sheet.getLastRow() < 2) return [];
  return sheet.getRange(2, 1, sheet.getLastRow() - 1, HEADERS_.length).getValues().map(function(values, i) {
    var row = { _row: i + 2 };
    HEADERS_.forEach(function(key, col) { row[key] = values[col]; });
    ['createdAt', 'reportedAt', 'paidAt', 'entryAt', 'proofAt', 'cancelledAt'].forEach(function(key) { if (row[key] instanceof Date) row[key] = row[key].toISOString(); });
    row.counts = JSON.parse(row.counts); row.audit = JSON.parse(row.audit || '[]');
    row.paymentPlan = row.paymentPlan ? JSON.parse(row.paymentPlan) : null;
    row.entryOverride = row.entryOverride === true || row.entryOverride === 'true';
    return row;
  });
}
function writeRow_(sheet, row) {
  var values = HEADERS_.map(function(key) {
    return key === 'counts' || key === 'audit' || key === 'paymentPlan' ? JSON.stringify(row[key] || (key === 'paymentPlan' ? null : [])) : row[key] === undefined ? '' : row[key];
  });
  var index = row._row || sheet.getLastRow() + 1;
  if (index > sheet.getMaxRows()) {
    var previous = sheet.getMaxRows(), extra = Math.max(100, index - previous);
    sheet.insertRowsAfter(previous, extra);
    HEADERS_.forEach(function(key, col) {
      if (['people', 'total', 'entryOverride'].indexOf(key) < 0) sheet.getRange(previous + 1, col + 1, extra, 1).setNumberFormat('@');
    });
  }
  sheet.getRange(index, 1, 1, HEADERS_.length).setValues([values]);
  SpreadsheetApp.flush();
}
function locked_(fn) {
  // Todas as gravações, públicas e administrativas, passam por este projeto.
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(20000)) fail_('Muitos acessos neste momento. Aguarde alguns segundos e tente novamente.');
  try { return fn(); } finally { lock.releaseLock(); }
}
function digest_(text) {
  return Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, text, Utilities.Charset.UTF_8).map(function(b) { return ((b + 256) % 256).toString(16).padStart(2, '0'); }).join('');
}
function tokenFor_(requestId) {
  var secret = props_().getProperty('TOKEN_SECRET');
  if (!secret) fail_('Configuração de segurança indisponível.');
  return Utilities.base64EncodeWebSafe(Utilities.computeHmacSha256Signature(requestId, secret)).replace(/=+$/, '');
}
function safeEqual_(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string' || a.length !== b.length) return false;
  var diff = 0; for (var i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}
function publicRow_(row) {
  return { id: row.id, name: row.name, phone: row.phone, counts: row.counts, people: row.people, total: row.total,
    status: registrationState_(row), createdAt: row.createdAt, reportedAt: row.reportedAt || '', entryAt: row.entryAt || '', cancelledAt: row.cancelledAt || '',
    paymentStatus: paymentState_(row), reservationStatus: reservationState_(row), proofSubmittedAt: row.proofAt || '',
    proofRejected: row.status === 'PROOF_REJECTED', paidAt: row.paidAt || '',
    reservationDeadline: EVENT_.deadline,
    pix: paymentParts_(row).length === 1 && paymentOpen_(row) && partState_(paymentParts_(row)[0]) === 'PENDING' ? pix_(row.total, row.id) : '', payment: paymentOverview_(row), paymentOptions: payableOptions_(row), remindersEnabled: Boolean(row.paymentPlan && row.paymentPlan.remindersEnabled), canChangePlan: paymentOpen_(row) && !paymentParts_(row).some(function(p) { return p.proofId || partState_(p) === 'PAID'; }), event: EVENT_ };
}
function withErrors_(fn) {
  try { return { ok: true, data: fn() }; }
  catch (e) {
    var message = String(e.message || '');
    // Falhas da plataforma podem conter IDs ou detalhes internos: não expor.
    if (/Exception|Service|quota|permission|authorization|timed out|limit exceeded|You do not have|Access denied/i.test(message)) {
      message = 'Serviço temporariamente indisponível ou sem permissão. Aguarde e tente novamente; se persistir, procure a organização.';
    }
    return { ok: false, error: message || 'Não foi possível concluir. Tente novamente.' };
  }
}
