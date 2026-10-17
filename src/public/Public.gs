function doGet() {
  var template = HtmlService.createTemplateFromFile('Index');
  template.config = JSON.stringify({ event: EVENT_, open: Date.now() < Date.parse(EVENT_.deadline), mode: 'public', url: ScriptApp.getService().getUrl() }).replace(/</g, '\\u003c');
  return template.evaluate().setTitle('Ceia de Confraternização 2026 | IPDiv')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}
function include_(name) { return HtmlService.createHtmlOutputFromFile(name).getContent(); }
function publicApi(action, input) {
  return withErrors_(function() {
    if (action === 'create') return create_(input);
    if (action === 'proof') return proof_(input);
    if (action === 'lookup' || action === 'report') return accessRegistration_(action, input);
    fail_('Ação inválida.');
  });
}
function create_(input) {
  var valid = registrationInput_(input);
  return locked_(function() {
    var sheet = sheet_(), rows = readRows_(sheet), requestHash = digest_(valid.requestId);
    var payloadHash = digest_(JSON.stringify({ name: valid.name, phone: valid.phone, counts: valid.counts }));
    var existing = rows.find(function(r) { return r.requestHash === requestHash; });
    var token = tokenFor_(valid.requestId);
    if (existing) {
      if (existing.payloadHash !== payloadHash) fail_('Este envio já foi recebido com outros dados. Consulte a inscrição ou inicie uma nova inscrição.');
      var result = publicRow_(existing); result.token = token; return result;
    }
    assertOpen_(Date.now());
    var id;
    do { id = 'IPD26' + Utilities.getUuid().replace(/-/g, '').slice(0, 16).toUpperCase(); }
    while (rows.some(function(r) { return r.id === id; }));
    var row = { id: id, createdAt: new Date().toISOString(), name: valid.name, phone: valid.phone,
      counts: valid.counts, people: valid.people, total: valid.total, status: 'PENDING',
      tokenHash: digest_(token), requestHash: requestHash, payloadHash: payloadHash, audit: [] };
    writeRow_(sheet, row);
    var result = publicRow_(row); result.token = token; return result;
  });
}
function accessRegistration_(action, input) {
  if (!input || typeof input.id !== 'string' || !/^IPD26[A-F0-9]{16}$/.test(input.id) || typeof input.token !== 'string' || !/^[a-zA-Z0-9_-]{43}$/.test(input.token)) fail_('Link inválido ou inscrição não encontrada.');
  return locked_(function() {
    var sheet = sheet_();
    var row = readRows_(sheet).find(function(r) { return r.id === input.id; });
    if (!row || !safeEqual_(row.tokenHash, digest_(input.token))) fail_('Link inválido ou inscrição não encontrada.');
    if (action === 'report' && !row.reportedAt) {
      row.reportedAt = new Date().toISOString();
      // Aviso é independente do estado financeiro e nunca confirma pagamento.
      sheet.getRange(row._row, HEADERS_.indexOf('reportedAt') + 1).setValue(row.reportedAt);
      SpreadsheetApp.flush();
    }
    return publicRow_(row);
  });
}
/** Executar UMA VEZ no editor, como proprietário, antes de publicar. Nunca via web. */
function initializePublic_() {
  var p = props_();
  if (!p.getProperty('SPREADSHEET_ID')) fail_('Defina SPREADSHEET_ID nas propriedades do script.');
  // Configurar a conta informada sem substituir permissões já salvas.
  if (!p.getProperty('ADMIN_ACCOUNTS')) p.setProperty('ADMIN_ACCOUNTS', JSON.stringify(initialAdminAccounts_()));
  if (!p.getProperty('TOKEN_SECRET')) p.setProperty('TOKEN_SECRET', Utilities.getUuid() + Utilities.getUuid());
  if (!p.getProperty('ADMIN_BRIDGE_SECRET')) p.setProperty('ADMIN_BRIDGE_SECRET', Utilities.getUuid() + Utilities.getUuid());
  var ss = spreadsheet_(), sheet = ss.getSheetByName('Inscricoes');
  if (!sheet) {
    sheet = ss.insertSheet('Inscricoes');
    sheet.getRange(1, 1, 1, HEADERS_.length).setValues([HEADERS_]);
    sheet.setFrozenRows(1);
    // Texto literal; valores monetários e quantidades permanecem numéricos.
    HEADERS_.filter(function(key) { return ['people', 'total', 'entryOverride'].indexOf(key) < 0; }).forEach(function(key) {
      sheet.getRange(2, HEADERS_.indexOf(key) + 1, sheet.getMaxRows() - 1, 1).setNumberFormat('@');
    });
  }
  sheet_();
  if (!p.getProperty('PROOF_FOLDER_ID')) p.setProperty('PROOF_FOLDER_ID', DriveApp.createFolder('Ceia IPDiv 2026 — Comprovantes privados').getId());
}

/** Comprovante opcional: privado, até 1 MiB; nunca confirma recebimento. */
function proof_(input) {
  if (!input || typeof input.id !== 'string' || !/^IPD26[A-F0-9]{16}$/.test(input.id) || typeof input.token !== 'string' || !/^[a-zA-Z0-9_-]{43}$/.test(input.token) || typeof input.base64 !== 'string' || input.base64.length > 1398104 || !/^[A-Za-z0-9+/]*={0,2}$/.test(input.base64)) fail_('Arquivo inválido. Use PDF, JPG ou PNG de até 1 MB.');
  return locked_(function() {
    var sheet = sheet_(), row = readRows_(sheet).find(function(r) { return r.id === input.id; });
    if (!row || typeof input.token !== 'string' || !safeEqual_(row.tokenHash, digest_(input.token))) fail_('Link inválido ou inscrição não encontrada.');
    if (row.proofId) return publicRow_(row); // Retry não cria outro arquivo.
    if (row.status === 'PAID') fail_('Pagamento já confirmado. Não é necessário enviar comprovante.');
    var bytes = Utilities.base64Decode(input.base64), unsigned = bytes.map(function(b) { return (b + 256) % 256; });
    if (!bytes.length || bytes.length > 1048576) fail_('O comprovante deve ter até 1 MB.');
    var mime, extension;
    if (unsigned.slice(0, 8).join(',') === '137,80,78,71,13,10,26,10') { mime = 'image/png'; extension = '.png'; }
    else if (unsigned[0] === 255 && unsigned[1] === 216 && unsigned[2] === 255) { mime = 'image/jpeg'; extension = '.jpg'; }
    else if (unsigned.slice(0, 5).join(',') === '37,80,68,70,45') { mime = 'application/pdf'; extension = '.pdf'; }
    else fail_('Formato não permitido. Use PDF, JPG ou PNG.');
    var folderId = props_().getProperty('PROOF_FOLDER_ID');
    if (!folderId) fail_('O envio de comprovantes ainda não está configurado. Você pode avisar a secretaria pelo WhatsApp (37) 3212-4980.');
    var folder = DriveApp.getFolderById(folderId);
    if (folder.getSharingAccess() !== DriveApp.Access.PRIVATE || folder.getEditors().length || folder.getViewers().length) fail_('Pasta de comprovantes não está privada. Procure a organização.');
    var file = folder.createFile(Utilities.newBlob(bytes, mime, row.id + extension));
    row.proofId = file.getId(); row.proofMime = mime; row.proofAt = new Date().toISOString();
    // Em erro de confirmação da gravação, preservar o arquivo privado: a escrita
    // pode ter sido efetivada antes de um timeout. Não apagar um arquivo referenciado.
    writeRow_(sheet, row);
    return publicRow_(row);
  });
}
