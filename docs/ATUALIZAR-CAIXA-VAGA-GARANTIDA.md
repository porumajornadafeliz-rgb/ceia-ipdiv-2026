# Caixa “Vaga garantida” em todas as inscrições — 19/10/2026

Use ATUALIZAR-CAIXA-VAGA-GARANTIDA-IPDIV-2026.zip. Este pacote atualiza somente a Administração. Extraia em uma pasta separada dos pacotes anteriores.

## Como ficará

Ao lado de cada inscrição, na coluna de ações, aparece uma caixa de seleção com o rótulo Vaga garantida, como as caixas de seleção mostradas pelo proprietário.

- Desmarcada: a inscrição ainda não tem a primeira parcela confirmada. Enquanto a reserva estiver ativa e dentro do prazo, o status continua RESERVA PROVISÓRIA.
- A secretaria baixa o comprovante, confere o documento e o recebimento na conta da igreja e marca a caixa. O sistema salva a confirmação, muda o status para VAGA GARANTIDA e registra conta e data no histórico.
- Marcada: a primeira parcela já foi confirmada. A caixa continua visível e marcada ao reabrir o painel. Confirmações anteriores e recebimentos reais permanecem preservados.
- A caixa é visível mesmo sem comprovante, com a indicação Aguardando comprovante da primeira parcela. Após o envio, baixe e confira o arquivo para liberar a marcação.
- A marcação confirma somente a primeira parcela ou o conjunto coberto pelo mesmo comprovante. Outras parcelas continuam com saldo próprio e CONFIRMAR RECEBIMENTO. A entrada exige quitação.
- Uma vaga já garantida não volta a provisória por um clique acidental: sua caixa aparece marcada e protegida contra desmarcação. Cancelamento mantém seu botão e histórico próprios e não faz estorno bancário.

As regras de inscrições canceladas ou reservas expiradas continuam: caixa desmarcada não reativa nem recria uma reserva. Arquivos substituídos precisam ser baixados novamente antes da confirmação. O envio de um comprovante sozinho não marca a caixa.

## Atualização passo a passo

1. Abra ADMINISTRACAO/Code.gs deste pacote no Bloco de Notas. Pressione Ctrl+A e Ctrl+C.
2. No navegador, abra o projeto existente Ceia IPDiv 2026 — Administração:
   https://script.google.com/home/projects/1EB2l_VpI1-Nvq2lSP9tqy_XGm0kKVMGLDF8lu5cFM68ina2r68xfKMUV/edit
3. Clique em Código.gs. Dentro do código, pressione Ctrl+A, Ctrl+V e Ctrl+S. Aguarde Salvo no Google Drive.
4. Clique em Implantar → Gerenciar implantações. Selecione a implantação administrativa existente e clique no lápis.
5. Em Versão, escolha Nova versão. Preserve Executar como: Usuário que acessa o app da Web e o acesso com Conta do Google. A lista de contas autorizadas permanece.
6. Clique em Implantar e Concluído. Reabra o mesmo endereço administrativo. Se já estiver aberto, recarregue com Ctrl+F5 e clique em ATUALIZAR DADOS.
7. Confira a caixa Vaga garantida em todas as linhas: marcada nas vagas já garantidas e desmarcada nas provisórias. Não é preciso filtrar comprovantes para enxergar as caixas.

O manifesto incluído é igual ao anterior. Não precisa alterar appsscript.json se o painel já funciona. Não precisa atualizar o Público para esta mudança visual e de confirmação.

Não execute prepararPublicacao nem funções de limpeza. Preserve todas as inscrições, pagamentos, comprovantes, configurações e endereços existentes. Há dados reais em produção.

Os testes usam apenas dados fictícios locais. O código está preparado para aplicação pelo proprietário; este pacote não altera sozinho a implantação do Google.
