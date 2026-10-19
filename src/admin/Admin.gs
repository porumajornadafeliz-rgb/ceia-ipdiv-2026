/** Projeto separado: executar como usuário que acessa; NÃO compartilhar o editor. */
function adminError_(code, message) { var error = new Error(message); error.code = code; return error; }
function identity_() {
  var email = Session.getActiveUser().getEmail().toLowerCase().trim();
  if (!email) throw adminError_('IDENTITY_REQUIRED','Conta não identificada. A implantação deve executar como o usuário que acessa.');
  return email;
}
function relay_(action, input) {
  var email = identity_(); // Obtido do Google no servidor, nunca de parâmetros do cliente.
  var p = PropertiesService.getScriptProperties();
  var url = p.getProperty('PUBLIC_WEB_APP_URL'), secret = p.getProperty('ADMIN_BRIDGE_SECRET');
  if (!url || !/^https:\/\/script\.google\.com\/macros\/s\/[a-zA-Z0-9_-]+\/exec$/.test(url) || !secret) throw adminError_('CONFIGURATION_REQUIRED','Configure o endereço público e a chave de comunicação nas propriedades do projeto administrativo.');
  var attempts = ['whoami','list','getProof'].indexOf(action) >= 0 ? 2 : 1;
  for (var attempt = 0; attempt < attempts; attempt++) {
    var payload = JSON.stringify({ email: email, action: action, input: input || {}, time: Date.now(), nonce: Utilities.getUuid() });
    var signature = Utilities.base64EncodeWebSafe(Utilities.computeHmacSha256Signature(payload, secret));
    var response;
    try {
      response = UrlFetchApp.fetch(url, { method: 'post', contentType: 'application/json',
        payload: JSON.stringify({ payload: payload, signature: signature }), muteHttpExceptions: true, followRedirects: true });
    } catch (e) {
      if (/permission|authorization|not have access/i.test(String(e.message || ''))) throw adminError_('GOOGLE_AUTHORIZATION','Autorização Google pendente para conectar os projetos.');
      if (attempt + 1 < attempts) continue;
      throw adminError_('COMMUNICATION_FAILED','Não foi possível comunicar com o serviço de inscrições. Tente novamente.');
    }
    var status = response.getResponseCode();
    if (status !== 200) {
      if ((status === 429 || status >= 500) && attempt + 1 < attempts) continue;
      throw adminError_('COMMUNICATION_FAILED','O serviço de inscrições não respondeu. Tente novamente; se persistir, confira a implantação pública.');
    }
    var result;
    try { result = JSON.parse(response.getContentText()); }
    catch (e) {
      if (attempt + 1 < attempts) continue;
      throw adminError_('INVALID_UPSTREAM_RESPONSE','A implantação pública não retornou dados. Confira o endereço /exec e o acesso anônimo.');
    }
    if (!result || typeof result.ok !== 'boolean') throw adminError_('INVALID_UPSTREAM_RESPONSE','O serviço de inscrições retornou uma resposta inválida. Tente novamente.');
    if (!result.ok) {
      var message = result.error || 'Não foi possível concluir.';
      throw adminError_(/^Acesso não autorizado/.test(message) ? 'ACCESS_DENIED' : 'REQUEST_REJECTED',message);
    }
    return result.data;
  }
}
function adminFailurePage_(error) {
  var title = 'Painel temporariamente indisponível', message = 'Não foi possível consultar o serviço de inscrições. Atualize esta página para tentar novamente. Se persistir, confira a implantação pública e a conexão entre os projetos.';
  if (error.code === 'ACCESS_DENIED' || error.code === 'IDENTITY_REQUIRED') {
    title = 'Acesso restrito'; message = 'Entre com uma conta Google autorizada. A implantação administrativa deve executar como o usuário que acessa e a conta deve estar na lista permitida.';
  } else if (error.code === 'CONFIGURATION_REQUIRED') {
    title = 'Configuração administrativa pendente'; message = 'Confira o endereço público /exec e a chave de comunicação nas propriedades do projeto administrativo.';
  } else if (error.code === 'GOOGLE_AUTHORIZATION') {
    title = 'Autorização Google pendente'; message = 'Entre no projeto Administração com a conta autorizada e confira as permissões de conexão externa.';
  }
  // Mensagens fixas: detalhes internos da exceção não são inseridos no HTML.
  return HtmlService.createHtmlOutput('<html lang="pt-BR"><meta name="viewport" content="width=device-width,initial-scale=1"><title>' + title + '</title><body style="font:20px system-ui;padding:40px"><h1>' + title + '</h1><p>' + message + '</p><p>Esta tela não altera inscrições ou pagamentos.</p></body></html>');
}
function doGet() {
  try {
    var actor = relay_('whoami', {});
    var template = HtmlService.createTemplateFromFile('Admin');
    template.config = JSON.stringify({ event: EVENT_, mode: 'admin', actor: actor }).replace(/</g, '\\u003c');
    return template.evaluate().setTitle('Administração | Ceia IPDiv 2026').addMetaTag('viewport', 'width=device-width, initial-scale=1');
  } catch (e) {
    console.warn('ADMIN_PAGE_FAILURE', e.code || 'UNEXPECTED');
    return adminFailurePage_(e);
  }
}
function include_(name) { return HtmlService.createHtmlOutputFromFile(name).getContent(); }
function adminApi(action, input) {
  try {
    if (['list', 'entry', 'cancel', 'getProof', 'payment', 'reservation', 'reminderOpened'].indexOf(action) < 0) throw new Error('Ação inválida.');
    return { ok: true, data: relay_(action, input) };
  } catch (e) {
    console.warn('ADMIN_REQUEST_FAILURE', e.code || 'UNEXPECTED');
    var msg = String(e.message || '');
    if (/Exception|Service|quota|permission|authorization|timed out|limit exceeded/i.test(msg)) msg = 'Serviço indisponível ou autorização Google pendente. Tente novamente ou procure a organização.';
    return { ok: false, error: msg || 'Não foi possível concluir.' };
  }
}
