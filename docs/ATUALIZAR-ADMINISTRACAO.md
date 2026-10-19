# Atualizar o painel Administração — 19/10/2026

Use ATUALIZAR-ADMINISTRACAO-IPDIV-2026.zip. Ele contém somente o projeto ADMINISTRACAO, já compatível com À vista até 20/12, 2x em 20/11 e 20/12 e 3x em 25/10, 20/11 e 20/12/2026.

Esta etapa atualiza apenas o código da Administração. Não recria a planilha, não limpa inscrições, não altera comprovantes nem modifica o endereço público divulgado. Registros novos recebidos desde a divulgação devem ser preservados.

## 1. Substituir o código da Administração

1. Extraia este ZIP em uma pasta separada dos pacotes anteriores.
2. Abra ADMINISTRACAO/Code.gs no Bloco de Notas. Pressione Ctrl+A e Ctrl+C.
3. No navegador, abra o projeto Ceia IPDiv 2026 — Administração.
4. Clique em Código.gs. Dentro do código, pressione Ctrl+A e Ctrl+V. Salve com Ctrl+S e aguarde Salvo no Google Drive.
5. O manifesto incluído é o mesmo da versão anterior: somente identificação da conta Google e conexão externa para o projeto Público. Não há permissão Drive adicional para a secretaria. Se o appsscript.json já contém esses dois escopos, não precisa alterá-lo.

Não execute prepararPublicacao nem funções de limpeza nesta etapa. As configurações de comunicação já existentes devem permanecer. Não envie chaves ou valores de propriedades pelo chat.

## 2. Atualizar a implantação existente

1. Clique em Implantar → Gerenciar implantações.
2. Selecione a implantação administrativa existente e clique no lápis.
3. Em Versão, escolha Nova versão.
4. Mantenha Executar como: Usuário que acessa o app da Web.
5. Mantenha Quem pode acessar: Qualquer pessoa com uma Conta do Google. A lista autorizada no servidor continua limitando o acesso à equipe.
6. Clique em Implantar e depois Concluído. Copie a URL do App da Web da Administração e guarde para a equipe; o endereço do Público é outro.
7. Abra a URL administrativa com a conta Google autorizada. Se houver pedido de permissões, autorize identificação da conta e Conectar-se a um serviço externo. Esta conexão é necessária para consultar e alterar os dados no projeto Público.
8. Clique em ATUALIZAR DADOS. Confira se os números correspondem às inscrições atuais. Só estarão zerados se ninguém tiver se inscrito desde a última limpeza.

## 3. Conferir os pagamentos

- Pesquise por nome, WhatsApp ou número da inscrição. O painel mostra quantidade de pessoas, situação da reserva, plano, total, recebido e saldo.
- Cada parcela mostra valor, vencimento, forma de pagamento e situação. Pagamento à vista tem uma única parcela.
- Use o filtro Comprovantes em conferência. Clique em BAIXAR COMPROVANTE da parcela ou conjunto indicado.
- Confira o documento e o recebimento na conta da igreja. Enviar um arquivo, por si só, não confirma que o dinheiro entrou.
- Clique em CONFERIR PAGAMENTO, escolha Confirmar pagamento recebido ou Recusar comprovante, registre uma observação e clique em REGISTRAR CONFERÊNCIA.
- Se o arquivo tiver sido substituído desde o download, atualize os dados e baixe o atual antes de conferir.
- Confirmar a primeira parcela garante as vagas. Enquanto houver parcelas pendentes, aparece Pagamento parcial. A entrada exige a quitação de todas.
- Parcelas vencidas agrupadas compartilham um comprovante e uma conferência. A aprovação reconhece a soma uma única vez.
- O botão Histórico identifica alterações, conta responsável e data. Cancelar inscrição libera lugares e não faz devolução bancária.

Não aprove pagamentos fictícios para testar a planilha em produção. A validação automática usa dados locais descartáveis e não acrescenta cadastros ao Google.

## 4. Relatórios e lembretes

EXPORTAR RELATÓRIO CSV gera uma linha por inscrição, com valor, recebido, saldo e situação. EXPORTAR PARCELAS CSV gera uma linha por parcela, com vencimento, valor, forma e conferência. Os relatórios respeitam pesquisa e filtros; os indicadores mostram a base inteira. IMPRIMIR LISTA FILTRADA imprime a seleção atual.

Lembretes de amanhã mostra pagamentos que vencem no dia seguinte, no horário de Brasília, somente com autorização do participante. Inclui o pagamento à vista em 19/12, quando ainda pendente. Pagamentos com comprovante em conferência não entram na fila.

Para manter sem contratação de serviços, os lembretes não são enviados automaticamente. Abra o painel diariamente e use ABRIR WHATSAPP. Envie usando o WhatsApp da igreja, confira a mensagem e toque em Enviar. Abrir a conversa fica no histórico; não é confirmação de envio ou entrega.

## 5. Entrada e contas da equipe

Conferência de entrada permite localizar inscrições quitadas e registrar a chegada da família inteira. Bloqueia inscrição cancelada, saldo pendente ou entrada já registrada.

Administrador acessa inscrições, pagamentos e entrada. Secretaria acessa pagamentos e relatórios. A equipe de entrada não recebe valores ou comprovantes. Contas adicionais precisam estar na lista já autorizada no projeto Público; esta atualização não concede acesso a novas pessoas.

Se aparecer Acesso restrito, confira a conta Google utilizada e o modo de execução da implantação. Preserve as propriedades PUBLIC_WEB_APP_URL e ADMIN_BRIDGE_SECRET já configuradas. Não recrie os projetos ou troque as chaves para tentar resolver sem diagnóstico.

O código foi preparado e testado localmente. Aplicar e validar a implantação Google exige a execução desses passos pelo proprietário.
