# Recuperação do painel e resposta ao marcar CONFIRMAR — 19/10/2026

Use ATUALIZAR-ACESSO-E-AGILIDADE-IPDIV-2026.zip. Contém somente a Administração. O Público deve continuar com a versão CONFIRMACAO-EDITAVEL já aplicada. Não substitua novamente o Público com este pacote.

## O que foi verificado e corrigido

A mensagem antiga Acesso restrito era usada para qualquer falha ao abrir o painel, incluindo indisponibilidade e resposta inválida do serviço de inscrições. Isso não permitia saber se era uma conta sem acesso ou um problema de comunicação. A causa exata da troca de página relatada no Google não pôde ser identificada só pela imagem.

O painel agora distingue conta realmente não autorizada, comunicação indisponível, configuração e autorização Google pendente. Em verificações de acesso, leitura da lista e download de comprovante, uma falha de comunicação transitória pode receber uma segunda tentativa. Uma alteração da inscrição não é reenviada automaticamente. Mensagens e registros não expõem chaves ou detalhes internos de exceções.

Ao marcar e desmarcar CONFIRMAR, a caixa mostra Salvando alteração… e aguarda a confirmação do servidor. Depois, usa a linha que o servidor já devolveu para atualizar o status e os indicadores conhecidos, sem fazer uma segunda consulta completa. Isso reduz uma chamada por clique bem-sucedido. O tempo de resposta do Google continua variável.

ATUALIZAR DADOS permanece disponível para sincronizar toda a lista e inscrições que chegaram em outras telas. O horário no rodapé continua indicando a última consulta completa. Se uma gravação perder a resposta, o painel consulta a situação salva antes de oferecer uma nova tentativa.

O teste local incluiu uma inscrição antiga com primeira parcela de R$ 40,00 confirmada e saldo de R$ 40,00, semelhante ao caso relatado. Marcar e desmarcar não navegou para outra página e preservou o pagamento e o comprovante. Também foram testadas falhas antes e depois da gravação, recuperação do estado, indicadores e preservação das permissões reais.

## Aplicar somente na Administração

1. Extraia o ZIP em uma pasta nova e abra ADMINISTRACAO/Code.gs no Bloco de Notas.
2. Pressione Ctrl+A e Ctrl+C.
3. Abra o projeto Ceia IPDiv 2026 — Administração:
   https://script.google.com/home/projects/1EB2l_VpI1-Nvq2lSP9tqy_XGm0kKVMGLDF8lu5cFM68ina2r68xfKMUV/edit
4. Em Código.gs, substitua todo o conteúdo e salve com Ctrl+S.
5. Clique em Implantar → Gerenciar implantações. Selecione a implantação administrativa ativa e clique no lápis.
6. Em Versão, escolha Nova versão. Preserve Executar como: Usuário que acessa o app da Web e o acesso com Conta do Google. A lista de contas autorizadas continua valendo.
7. Clique em Implantar e Concluído. Reabra o mesmo endereço do painel e pressione Ctrl+F5.
8. Ao usar a caixa, aguarde Salvando alteração… terminar antes de tentar outra alteração na mesma inscrição.

Não é necessário clicar em Executar. As funções do painel são chamadas automaticamente ao abrir a página e usar seus controles. O manifesto é igual ao anterior. Preserve as propriedades, a planilha, os dados reais, os pagamentos, os comprovantes e os endereços. Não execute funções de configuração ou limpeza.

## Se ainda surgir uma página de erro

Anote o título e a mensagem exata da nova tela. No editor Administração, Execuções é o histórico automático das chamadas; não é o botão Executar. Abra o registro correspondente ao momento da falha e veja os Registros. Os novos códigos ADMIN_PAGE_FAILURE e ADMIN_REQUEST_FAILURE ajudam a distinguir comunicação e acesso. Uma falha tratada pode aparecer com execução concluída, pois o código devolveu uma mensagem à página. Copie somente a mensagem ou o código necessário, sem compartilhar chaves ou propriedades.

A verificação local não acessa a conta Google da igreja. A aplicação e a confirmação do comportamento na implantação real dependem destes passos pelo proprietário.
