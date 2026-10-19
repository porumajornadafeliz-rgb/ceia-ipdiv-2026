# Confirmação simples no painel — 19/10/2026

Use ATUALIZAR-CONFIRMACAO-SIMPLES-IPDIV-2026.zip. Ele contém as pastas ADMINISTRACAO e PUBLICO, com Code.gs e o manifesto de cada projeto. Extraia em uma pasta separada.

## O que muda

A secretaria baixa o comprovante e confere o documento e o recebimento na conta da igreja. Depois clica em MARCAR VAGA GARANTIDA na mesma linha, junto de BAIXAR COMPROVANTE, CANCELAR INSCRIÇÃO e Histórico. A confirmação normal não abre formulário nem exige digitar uma justificativa. A conta responsável e a data ficam registradas automaticamente no histórico.

O botão é liberado após baixar o comprovante nessa sessão do painel. Confirmar o primeiro pagamento muda RESERVA PROVISÓRIA para VAGA GARANTIDA e registra somente as parcelas cobertas por aquele comprovante. As próximas parcelas têm o botão CONFIRMAR RECEBIMENTO e mantêm seu saldo próprio. Comprovantes de parcelas vencidas pagas em conjunto têm uma única confirmação para a soma. A entrada continua exigindo quitação.

Enviar um arquivo pelo site mantém COMPROVANTE EM CONFERÊNCIA até a confirmação da secretaria. Se o documento mudar após o download, o sistema exige baixar e conferir o atual. Para recusar um comprovante divergente, abra Outras ações → RECUSAR COMPROVANTE e informe o motivo. Recusas e cancelamentos continuam no histórico.

No Público, após salvar o comprovante, abre-se a conversa da secretaria no WhatsApp com o resumo preenchido. O participante confere e toca em Enviar. Se o navegador bloquear a abertura, aparece ABRIR MENSAGEM PARA A SECRETARIA. O arquivo enviado pelo site permanece privado no sistema para download pela secretaria; a conversa contém o resumo da inscrição, plano e situação. Não há contratação de serviço, integração bancária ou confirmação automática de entrega da mensagem.

## 1. Atualizar a Administração

1. Abra ADMINISTRACAO/Code.gs deste pacote no Bloco de Notas. Use Ctrl+A e Ctrl+C.
2. Abra o projeto existente Ceia IPDiv 2026 — Administração no Google Apps Script.
3. Clique em Código.gs. Dentro do código, use Ctrl+A, Ctrl+V e Ctrl+S. Aguarde Salvo no Google Drive.
4. Clique em Implantar → Gerenciar implantações. Selecione a implantação administrativa atual e clique no lápis.
5. Em Versão, escolha Nova versão. Preserve Executar como: Usuário que acessa o app da Web e o acesso com Conta do Google. A lista de contas autorizadas continua restringindo o painel.
6. Clique em Implantar e Concluído. Reabra o mesmo endereço do painel e clique em ATUALIZAR DADOS.

O botão MARCAR VAGA GARANTIDA aparece em inscrições ativas com comprovante da primeira parcela em conferência. Se a primeira parcela já estiver confirmada, a inscrição continua garantida e não precisa ser confirmada novamente.

## 2. Atualizar o Público para abrir a conversa após salvar

1. Abra PUBLICO/Code.gs deste pacote no Bloco de Notas. Use Ctrl+A e Ctrl+C.
2. Abra o projeto existente Ceia IPDiv 2026 — Público.
3. Em Código.gs, substitua o conteúdo por esse código e salve.
4. Em Implantar → Gerenciar implantações, edite a implantação pública atual pelo lápis e escolha Nova versão.
5. Preserve Executar como: Eu e Quem pode acessar: Qualquer pessoa. Clique em Implantar e Concluído.
6. O endereço já divulgado permanece o mesmo. Abra-o novamente para carregar a atualização.

Os manifestos incluídos são iguais aos anteriores: não é necessário substituí-los se esses projetos já funcionam. As propriedades, chaves, planilha e pasta privada continuam as mesmas. Não execute prepararPublicacao nem funções de limpeza para esta atualização. Há inscrições e pagamentos reais: preserve todos.

## 3. Conferir em operação

Use apenas comprovantes e recebimentos reais para confirmar pagamentos na produção. Confira nome, valor recebido e parcela antes de marcar. Após confirmar, o painel deve mostrar VAGA GARANTIDA, o valor recebido e o saldo ainda devido, sem descontar vagas novamente. Histórico e relatórios devem refletir essa confirmação. Use ATUALIZAR INSCRIÇÃO na consulta pública para obter a situação atual.

Os testes foram executados localmente com dados e arquivos fictícios; não acessam a planilha da igreja nem enviam mensagens reais. Aplicar essas duas atualizações no Google exige seguir os passos acima. Nenhuma limpeza faz parte deste pacote.
