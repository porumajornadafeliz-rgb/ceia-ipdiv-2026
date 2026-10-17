function doGet() {
  var template = HtmlService.createTemplateFromFile('Index');
  template.config = JSON.stringify({ event: EVENT_, open: Date.now() < Date.parse(EVENT_.deadline), mode: 'public', url: ScriptApp.getService().getUrl() }).replace(/</g, '\\u003c');
  return template.evaluate().setTitle('Ceia de Confraternização 2026 | IPDiv')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}
function include_(name) { return HtmlService.createHtmlOutputFromFile(name).getContent(); }
function publicApi(action, input) {
  return withErrors_(function() {
    if (action === 'capacity') return locked_(function() { return capacityForRows_(readRows_(sheet_())); });
    if (action === 'create') return create_(input);
    if (action === 'status') return registrationStatus_(input);
    if (action === 'paymentDetails') return paymentDetails_(input);
    if (action === 'proof') return submitProof_(input);
    if (action === 'lookup' || action === 'report' || action === 'confirmation') return accessRegistration_(action, input);
    fail_('Ação inválida.');
  });
}
function registrationStatus_(input) {
  var contact = contactInput_(input);
  return locked_(function() {
    // Limite por telefone também vale para tentativas com nomes diferentes.
    // CacheService é proteção de melhor esforço; não é autenticação de identidade.
    var cache = CacheService.getScriptCache();
    var key = 'status:' + Math.floor(Date.now() / 60000) + ':' + digest_(contact.phone);
    var attempts = Number(cache.get(key) || 0);
    if (attempts >= 8) fail_('Muitas consultas para este WhatsApp. Aguarde um minuto e tente novamente.');
    cache.put(key, String(attempts + 1), 90);
    var rows = readRows_(sheet_()), result = statusResults_(rows, contact);
    var matches = rows.filter(function(row) { return statusName_(row.name) === statusName_(contact.name) && row.phone === contact.phone; }).slice(-20).reverse();
    result.registrations.forEach(function(item, i) { item.paymentAccess = paymentAccess_(matches[i]); });
    return result;
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
    assertSeats_(capacityForRows_(rows), valid.people);
    var id;
    do { id = 'IPD26' + Utilities.getUuid().replace(/-/g, '').slice(0, 16).toUpperCase(); }
    while (rows.some(function(r) { return r.id === id; }));
    var row = { id: id, createdAt: new Date().toISOString(), name: valid.name, phone: valid.phone,
      counts: valid.counts, people: valid.people, total: valid.total, status: 'REGISTERED',
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
      // Registrar abertura da conversa não atesta envio/entrega de mensagem ou pagamento.
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
  var capacity = initialCapacity_();
  if (!p.getProperty('MAX_PARTICIPANTS')) p.setProperty('MAX_PARTICIPANTS', String(capacity.limit));
  p.setProperty('SEAT_POLICY', capacity.policy); // Migração explícita para vagas por inscrição.
  if (!p.getProperty('TOKEN_SECRET')) p.setProperty('TOKEN_SECRET', Utilities.getUuid() + Utilities.getUuid());
  if (!p.getProperty('ADMIN_BRIDGE_SECRET')) p.setProperty('ADMIN_BRIDGE_SECRET', Utilities.getUuid() + Utilities.getUuid());
  if (!p.getProperty('PROOF_FOLDER_ID')) p.setProperty('PROOF_FOLDER_ID', DriveApp.createFolder('Ceia IPDiv 2026 — Comprovantes privados').getId());
  proofFolder_();
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
  // Acrescentar a nova coluna sem apagar ou reordenar registros e históricos existentes.
  var previousHeaders = HEADERS_.slice(0, -1);
  var currentHeaders = sheet.getRange(1, 1, 1, HEADERS_.length).getValues()[0];
  if (JSON.stringify(currentHeaders.slice(0, -1)) === JSON.stringify(previousHeaders) && currentHeaders[currentHeaders.length - 1] === '') {
    sheet.getRange(1, HEADERS_.length).setValue('cancelledAt');
    sheet.getRange(2, HEADERS_.length, sheet.getMaxRows() - 1, 1).setNumberFormat('@');
  }
  sheet_();
}

/** Executar somente pelo proprietário no editor. Cria a planilha se ainda não foi indicada. */
function prepararPublicacao() {
  var usuario = Session.getActiveUser().getEmail().toLowerCase().trim();
  var proprietario = Session.getEffectiveUser().getEmail().toLowerCase().trim();
  if (usuario !== 'porumajornadafeliz@gmail.com' || usuario !== proprietario) {
    fail_('Execute esta configuração no editor com a conta proprietária porumajornadafeliz@gmail.com.');
  }
  return prepararPublicacao_();
}

/** Rotina privada; a função visível acima confere a identidade antes de chamá-la. */
function prepararPublicacao_() {
  return locked_(function() {
    var p = props_();
    if (!p.getProperty('SPREADSHEET_ID')) {
      var book = SpreadsheetApp.create('Ceia IPDiv 2026 — Inscrições');
      p.setProperty('SPREADSHEET_ID', book.getId());
    }
    initializePublic_();
    var rows = readRows_(sheet_()), capacity = capacityForRows_(rows);
    var result = { planilha: spreadsheet_().getUrl(), inscricoesAtivas: rows.filter(function(r) { return !r.cancelledAt; }).length,
      limite: capacity.limit, vagasRestantes: capacity.remaining };
    console.log('Configuração concluída. Planilha: ' + result.planilha + '. Inscrições ativas: ' + result.inscricoesAtivas + '. Vagas restantes: ' + result.vagasRestantes + '.');
    return result;
  });
}
