# CONFIRMAR editável: marcar e desmarcar — 19/10/2026

Use ATUALIZAR-CONFIRMACAO-EDITAVEL-IPDIV-2026.zip. Ele contém os dois projetos, PUBLICO e ADMINISTRACAO. Esta correção exige atualizar os dois, nesta ordem: primeiro Público, depois Administração. O Público salva a garantia na planilha compartilhada; a Administração exibe a caixa e envia a alteração autorizada.

## Regra solicitada

- Toda inscrição ativa tem a caixa CONFIRMAR clicável, mesmo sem comprovante.
- Marcar deixa a caixa azul e muda o status para VAGA GARANTIDA. Pode ser usado para uma vaga oferecida pela igreja.
- Desmarcar retira a garantia: volta para RESERVA PROVISÓRIA enquanto o prazo estiver aberto. Depois do prazo de 20/12/2026 às 23h59 (Brasília), uma reserva desmarcada fica expirada e libera os lugares.
- A secretaria pode marcar e desmarcar novamente. A decisão é salva e permanece ao recarregar o painel e na consulta pública. Cada alteração registra conta Google, data e horário no Histórico.
- Não é necessário anexar ou baixar comprovante para usar a caixa. O download continua disponível para conferência quando houver arquivo.
- Garantia e pagamento são controles independentes. Marcar ou desmarcar não lança receita, não desfaz recebimentos, não muda parcelas nem quita ou isenta o saldo. A confirmação de uma vaga oferecida não inventa pagamento.
- Para registrar dinheiro efetivamente recebido, baixe e confira o comprovante e use CONFIRMAR RECEBIMENTO da parcela. Esse botão não marca a caixa por conta própria.
- O contador continua incluindo as reservas dentro do prazo e as vagas garantidas. Marcar uma reserva que já ocupa lugares não desconta novamente. Para garantir uma reserva expirada, o servidor verifica se há lugar para toda a família, dentro do limite de 200.
- Inscrições canceladas precisam ser reativadas pelo botão próprio antes de garantir vagas. Pagamentos e confirmações reais anteriores são preservados; agora a equipe também pode desmarcar essas garantias.

## 1. Atualizar o Público

1. Extraia o ZIP em uma pasta nova. Abra PUBLICO/Code.gs no Bloco de Notas. Pressione Ctrl+A e Ctrl+C.
2. Abra o projeto Ceia IPDiv 2026 — Público:
   https://script.google.com/home/projects/1J-PexfQ-BNhXpX_U2sd4eEbGgXhM4sc0y1C1exvYf9RyLnikHWxLXhqd/edit
3. Em Código.gs, substitua todo o conteúdo e salve com Ctrl+S. Aguarde Salvo no Google Drive.
4. Clique em Implantar → Gerenciar implantações → escolha a implantação pública existente → lápis → Versão: Nova versão.
5. Preserve Executar como: Eu e Quem pode acessar: Qualquer pessoa. Clique em Implantar e Concluído. O link divulgado permanece igual.

## 2. Atualizar a Administração

1. Abra ADMINISTRACAO/Code.gs deste pacote no Bloco de Notas. Pressione Ctrl+A e Ctrl+C.
2. Abra o projeto Ceia IPDiv 2026 — Administração:
   https://script.google.com/home/projects/1EB2l_VpI1-Nvq2lSP9tqy_XGm0kKVMGLDF8lu5cFM68ina2r68xfKMUV/edit
3. Substitua Código.gs e salve com Ctrl+S.
4. Em Implantar → Gerenciar implantações, edite a implantação administrativa existente pelo lápis e escolha Nova versão.
5. Preserve Executar como: Usuário que acessa o app da Web e o acesso com Conta do Google. A lista de contas permitidas permanece. Clique em Implantar e Concluído.
6. Reabra o mesmo endereço do painel e pressione Ctrl+F5. Clique em ATUALIZAR DADOS. A caixa CONFIRMAR das inscrições ativas fica disponível para marcar e desmarcar, com ou sem comprovante.

## Preservação e conferência

Os manifestos permanecem iguais. Não altere appsscript.json se os projetos já funcionam. Não execute prepararPublicacao nem funções de limpeza. Não é necessário alterar cabeçalhos, recriar planilha, apagar cadastros, trocar configurações ou mover comprovantes. As decisões novas são salvas no histórico já existente da inscrição.

Há inscrições e pagamentos reais. Faça alterações somente conforme decisões reais da organização. Os testes locais usam dados fictícios e não alteram o Google da igreja. A regra anterior de quitação para entrada permanece: confirmar uma vaga não cria automaticamente uma isenção financeira ou desfaz entrada já registrada.

Se o painel indicar que a inscrição mudou enquanto estava aberta, clique em ATUALIZAR DADOS antes de alterar a caixa; isso evita sobrescrever uma decisão feita em outra tela.
