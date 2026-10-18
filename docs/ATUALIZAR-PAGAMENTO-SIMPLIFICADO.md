# Atualizar somente o Público — escolha simplificada de pagamento

Pacote atual: ATUALIZAR-PAGAMENTO-SIMPLIFICADO-IPDIV-2026.zip. Não use o ZIP anterior para esta revisão. A conclusão do painel Administração fica para a próxima etapa; não é necessário substituir seu código agora.

## Comportamento

1. Confirmar a inscrição abre a área de pagamento.
2. Inicialmente aparecem somente À vista, 2x e 3x e o botão CONTINUAR PARA PAGAMENTO.
3. Escolher uma opção revela o valor e as datas. Continuar abre Pix ou depósito e envio obrigatório de comprovante.
4. À vista: valor integral até 20/12/2026.
5. 2x: 20/11 e 20/12/2026. 3x: 25/10, 20/11 e 20/12/2026. Parcelas vencidas são cobradas juntas; as futuras continuam separadas. Não há juros acrescentados pelo sistema.
6. A primeira parcela confirmada pela secretaria garante as vagas; enviar o arquivo ainda exige conferência. O contador e o vencimento das reservas continuam funcionando.
7. Pix ou depósito em conta Itaú, agência 0690, C/C 16.405-8, Igreja Presbiteriana de Divinópolis. Os dados bancários não foram alterados.
8. Lembretes ficam preparados no painel um dia antes de cada vencimento, inclusive à vista em 19/12. Para manter sem contratação de serviços, a secretaria abre a mensagem e toca em Enviar no WhatsApp da igreja. Não há envio automático ou confirmação de entrega. A preparação respeita a autorização do participante.

## Passo a passo — Público

1. Extraia este ZIP em uma nova pasta.
2. Abra PUBLICO/Code.gs no Bloco de Notas. Pressione Ctrl+A e Ctrl+C.
3. Abra o projeto Ceia IPDiv 2026 — Público no Google Apps Script. Em Código.gs, substitua todo o conteúdo pelo que copiou e salve.
4. O manifesto permanece igual ao da versão de Pix/comprovantes. Não há nova permissão. A cópia appsscript.json foi incluída para conferência.
5. Selecione prepararPublicacao no menu de funções e clique em Executar com a conta proprietária porumajornadafeliz@gmail.com. Aguarde Configuração concluída e Execução concluída.
6. Esta rotina preserva inscrições, chaves, comprovantes e arquivos de teste já arquivados. Acrescenta paymentPlan se ainda faltar. Prorroga para 20/12 apenas os planos À vista da versão anterior que ainda venciam em 25/10 e não foram confirmados como pagos. Não altera datas de parcelas, valores ou pagamentos conferidos.
7. Clique em Implantar → Gerenciar implantações → implantação pública existente → lápis → Nova versão → Implantar → Concluído. Preserve Executar como: Eu; acesso: Qualquer pessoa.
8. Abra o endereço público habitual. Consulte uma inscrição controlada por nome e WhatsApp, escolha a condição e confira o valor, vencimentos, Pix/depósito e comprovante. Alterar a condição continua permitido somente antes de enviar qualquer comprovante.

Não limpe o sistema novamente. Não recrie planilha, não apague propriedades, não publique uma nova implantação com outro endereço.

A atualização foi testada localmente. Ainda precisa ser aplicada ao projeto Google pelo proprietário. Nenhum teste fez pagamento real, enviou mensagem ou escreveu na planilha da igreja.
