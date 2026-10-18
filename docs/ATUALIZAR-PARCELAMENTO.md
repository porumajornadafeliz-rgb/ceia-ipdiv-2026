# Atualizar condições e formas de pagamento

Use o pacote **ATUALIZAR-PARCELAMENTO-IPDIV-2026.zip** nos dois projetos já existentes. Esta atualização preserva inscrições, pagamentos, comprovantes, arquivos de teste arquivados, chaves e endereços. Não executa limpeza de registros.

## Regras definidas pela igreja

- À vista: até 20/12/2026.
- 2 vezes: 20/11/2026 e 20/12/2026.
- 3 vezes: 25/10/2026, 20/11/2026 e 20/12/2026.
- O valor total é o mesmo, sem juros acrescentados pelo sistema. Centavos são distribuídos entre as parcelas para fechar o total exato.
- Depois de um vencimento, as parcelas já vencidas são cobradas juntas na inscrição. Um pagamento conjunto usa um QR/Copia e Cola com a soma e um comprovante para o conjunto.
- A primeira parcela confirmada pela secretaria garante as vagas. Enviar um comprovante, sem conferência, não confirma o pagamento.
- As vagas garantidas pela primeira parcela continuam contabilizadas mesmo se houver saldo atrasado; não há cancelamento automático por atraso das demais. O saldo continua devido e a entrada exige quitação.
- Reservas sem a primeira parcela confirmada expiram após 20/12/2026, às 23h59 (Brasília), preservando os registros.
- Pix ou depósito: Itaú, agência 0690, conta corrente 16.405-8, Igreja Presbiteriana de Divinópolis. A secretaria confere cada pagamento e seu comprovante no painel.
- Sem contratação de Meta, API bancária ou serviço de mensagens. Lembretes de parcelas que vencem amanhã aparecem no painel para a secretaria abrir e enviar manualmente pelo WhatsApp, quando autorizados pelo participante. O sistema não comprova envio ou entrega.

Exemplo de R$ 320: à vista R$ 320; 2x de R$ 160; 3x de R$ 106,67 + R$ 106,67 + R$ 106,66. Uma inscrição feita após 20/11 em 3x terá R$ 213,34 cobrados agora e R$ 106,66 em 20/12.

## 1. Atualizar o Público

1. Extraia o novo ZIP em uma pasta separada dos pacotes anteriores.
2. Abra `PUBLICO/Code.gs` com o Bloco de Notas e copie tudo.
3. Na aba **Ceia IPDiv 2026 — Público**, abra **Código.gs**, substitua todo o conteúdo pelo código copiado e salve.
4. Os manifestos continuam iguais aos da atualização de Pix/comprovantes. As cópias estão incluídas para conferência ou instalação nova; não há escopo Meta ou de envio automático.
5. No editor, escolha **prepararPublicacao** e execute com a conta proprietária **porumajornadafeliz@gmail.com**. A rotina acrescenta a coluna `paymentPlan` quando necessário e preserva as demais colunas e todos os registros. Aguarde **Configuração concluída** e **Execução concluída**.
6. **Implantar → Gerenciar implantações → implantação pública existente → lápis → Versão: Nova versão → Implantar**. Mantenha execução como **Eu** e acesso **Qualquer pessoa**.
7. Clique em **Concluído**. O endereço público habitual continua válido.

Não execute a função de limpeza de testes para atualizar. O arquivo temporário LIMPAR TESTES.gs deve continuar removido do editor.

## 2. Atualizar a Administração

1. Abra `ADMINISTRACAO/Code.gs` deste novo pacote no Bloco de Notas e copie tudo.
2. Na aba **Ceia IPDiv 2026 — Administração**, substitua todo o conteúdo de **Código.gs** e salve.
3. **Implantar → Gerenciar implantações → implantação administrativa existente → lápis → Nova versão → Implantar**.
4. Preserve **Executar como: Usuário com acesso ao app da Web** e **Quem pode acessar: Qualquer pessoa com uma Conta do Google**. A lista de contas autorizadas permanece.
5. Se a autorização externa ainda estiver pendente, autorize identificação da conta e **Conectar-se a um serviço externo**, usados para comunicar os dois projetos Google.
6. Abra o painel habitual e clique em **ATUALIZAR DADOS**.

## Uso e conferência

O participante registra a família e, na tela de pagamento, escolhe a condição. As datas, valores, total recebido e saldo aparecem abaixo. Pode trocar o plano antes de enviar qualquer comprovante. Depois disso, o plano fica protegido para não mudar o valor de pagamentos já enviados.

Selecione o pagamento ou conjunto de parcelas e depois **Pix** ou **Depósito em conta**. Envie o comprovante correspondente. Um comprovante já usado em outro pagamento da mesma inscrição não pode ser reaproveitado para contabilizar o mesmo valor duas vezes.

Na Administração, use **BAIXAR COMPROVANTE · 1 e 2**, por exemplo, e depois **CONFERIR PAGAMENTO · 1 e 2**. Confira a soma, o favorecido e o recebimento antes de aprovar. Aprovar um comprovante conjunto confirma todas as parcelas indicadas. Recusar permite reenviar. Cancelar inscrição não faz devolução bancária.

O painel mostra **Pagamento parcial** até quitar tudo. A situação das vagas é independente: **Vaga garantida** após a primeira parcela. O relatório de inscrições inclui recebido e saldo; **EXPORTAR PARCELAS CSV** detalha datas, valores, situação, forma e conferência de cada parcela.

**Lembretes de amanhã** mostra somente parcelas pendentes, com autorização de WhatsApp. Parcelas pagas ou com comprovante em conferência e inscrições canceladas não entram nessa lista. Abrir a conversa fica registrado como abertura, sem afirmar que a mensagem foi enviada. A secretaria precisa abrir o painel diariamente e tocar em Enviar no WhatsApp.

Dados de versões anteriores conservam o plano integral original e o vencimento geral de 20/12/2026. Não são automaticamente parcelados nem inscritos em lembretes. Se não houver comprovante enviado, o próprio participante poderá escolher uma nova condição pela consulta.

A atualização foi testada em ambiente local; não publica mudanças na conta Google nem realiza pagamentos ou envios de WhatsApp reais. Depois de aplicar, confira o fluxo com uma inscrição controlada já existente. Nenhum teste automatizado acrescenta registros à planilha da igreja.
