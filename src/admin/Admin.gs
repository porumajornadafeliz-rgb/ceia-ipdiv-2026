/** Projeto separado: executar como usuário que acessa; NÃO compartilhar o editor. */
function identity_() {
  var email = Session.getActiveUser().getEmail().toLowerCase().trim();
  if (!email) throw new Error('Conta não identificada. A implantação deve executar como o usuário que acessa.');
  return email;
}
function relay_(action, input) {
  var email = identity_(); // Obtido do Google no servidor, nunca de parâmetros do cliente.
  var p = PropertiesService.getScriptProperties();
  var url = p.getProperty('PUBLIC_WEB_APP_URL'), secret = p.getProperty('ADMIN_BRIDGE_SECRET');
  if (!url || !/^https:\/\/script\.google\.com\/macros\/s\/[a-zA-Z0-9_-]+\/exec$/.test(url) || !secret) throw new Error('Configure o endereço público e a chave de comunicação nas propriedades do projeto administrativo.');
  var payload = JSON.stringify({ email: email, action: action, input: input || {}, time: Date.now(), nonce: Utilities.getUuid() });
  var signature = Utilities.base64EncodeWebSafe(Utilities.computeHmacSha256Signature(payload, secret));
  var response = UrlFetchApp.fetch(url, { method: 'post', contentType: 'application/json',
    payload: JSON.stringify({ payload: payload, signature: signature }), muteHttpExceptions: true, followRedirects: true });
  if (response.getResponseCode() !== 200) throw new Error('Comunicação indisponível. Verifique a implantação pública e tente novamente.');
  var result;
  try { result = JSON.parse(response.getContentText()); } catch (e) { throw new Error('A implantação pública não retornou dados. Confira o endereço /exec e o acesso anônimo.'); }
  if (!result.ok) throw new Error(result.error || 'Acesso não autorizado.');
  return result.data;
}
function doGet() {
  try {
    var actor = relay_('whoami', {});
    var template = HtmlService.createTemplateFromFile('Admin');
    template.config = JSON.stringify({ event: EVENT_, mode: 'admin', actor: actor }).replace(/</g, '\\u003c');
    return template.evaluate().setTitle('Administração | Ceia IPDiv 2026').addMetaTag('viewport', 'width=device-width, initial-scale=1');
  } catch (e) {
    return HtmlService.createHtmlOutput('<html lang="pt-BR"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Acesso restrito</title><body style="font:20px system-ui;padding:40px"><h1>Acesso restrito</h1><p>Entre com uma conta Google autorizada. Se já entrou, solicite à organização a conferência das permissões e da implantação.</p></body></html>');
  }
}
function include_(name) { return HtmlService.createHtmlOutputFromFile(name).getContent(); }
function adminApi(action, input) {
  try {
    if (['list', 'payment', 'entry', 'getProof'].indexOf(action) < 0) throw new Error('Ação inválida.');
    return { ok: true, data: relay_(action, input) };
  } catch (e) {
    var msg = String(e.message || '');
    if (/Exception|Service|quota|permission|authorization|timed out|limit exceeded/i.test(msg)) msg = 'Serviço indisponível ou autorização Google pendente. Tente novamente ou procure a organização.';
    return { ok: false, error: msg || 'Não foi possível concluir.' };
  }
}
