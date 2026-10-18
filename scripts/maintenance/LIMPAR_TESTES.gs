/** Manutenção única, SOMENTE no editor do Público, antes da divulgação.
 * O proprietário confirmou que TODOS os registros atuais são testes.
 * Não incluir este arquivo nas implantações. Excluir do editor após executar.
 */
function limparTestesAntesDaDivulgacao() {
  var usuario = Session.getActiveUser().getEmail().toLowerCase().trim();
  var proprietario = Session.getEffectiveUser().getEmail().toLowerCase().trim();
  if (usuario !== 'porumajornadafeliz@gmail.com' || usuario !== proprietario) {
    fail_('Execute somente no editor com a conta proprietária porumajornadafeliz@gmail.com.');
  }
  return locked_(function() {
    var propriedades = props_(), marcador = propriedades.getProperty('LIMPEZA_TESTES_2026');
    var planilha = spreadsheet_(), aba = sheet_(), registros = readRows_(aba);
    var capacidade = capacityForRows_(registros);
    if (marcador) {
      console.log('A limpeza única já foi registrada. Nenhum dado foi alterado nesta execução. Inscrições atuais: ' + registros.length + '. Vagas restantes: ' + capacidade.remaining + '.');
      return { alterado: false, inscricoes: registros.length, vagasRestantes: capacidade.remaining };
    }
    if (!capacidade.configured || capacidade.limit !== 200) fail_('Confira o limite de 200 participantes antes da limpeza. Nenhum registro foi alterado.');
    var momento = new Date().toISOString(), arquivo = '';
    if (registros.length) {
      // Copiar a aba inteira para o MESMO arquivo conserva a privacidade e os documentos vinculados.
      var original = aba.getRange(1, 1, aba.getLastRow(), HEADERS_.length).getValues();
      var copia = aba.copyTo(planilha);
      arquivo = 'Arquivo testes ' + momento.replace(/[:.]/g, '-') + ' ' + Utilities.getUuid().slice(0, 8);
      copia.setName(arquivo);
      SpreadsheetApp.flush();
      var preservado = copia.getRange(1, 1, original.length, HEADERS_.length).getValues();
      if (JSON.stringify(original) !== JSON.stringify(preservado)) fail_('A cópia de segurança não foi validada. A base original permanece intacta.');
    }
    // Registrar ANTES de limpar impede repetição acidental mesmo se o retorno da plataforma falhar.
    propriedades.setProperty('LIMPEZA_TESTES_2026', JSON.stringify({ em: momento, estado: 'copia_validada', arquivo: arquivo, quantidade: registros.length }));
    if (registros.length) {
      // Preserva cabeçalhos, formatos, planilha, segredos, permissões e arquivos privados do Drive.
      aba.getRange(2, 1, registros.length, HEADERS_.length).clearContent();
      SpreadsheetApp.flush();
    }
    var restantes = readRows_(sheet_()), final = capacityForRows_(restantes);
    if (restantes.length || final.remaining !== 200) fail_('A conferência final da limpeza não terminou. A cópia está preservada; confira a planilha antes de divulgar.');
    propriedades.setProperty('LIMPEZA_TESTES_2026', JSON.stringify({ em: momento, estado: 'concluida', arquivo: arquivo, quantidade: registros.length }));
    console.log('LIMPEZA CONCLUÍDA. Inscrições ativas: 0. Vagas disponíveis: 200. Registros de teste arquivados: ' + registros.length + (arquivo ? '. Cópia na aba: ' + arquivo : '') + '. Comprovantes preservados na pasta privada.');
    return { alterado: true, inscricoes: 0, vagasRestantes: 200, testesArquivados: registros.length, arquivo: arquivo };
  });
}
