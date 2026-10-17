CEIA IPDIV 2026 — COLOCAR A VERSÃO DEFINITIVA NO AR

COMO OS MEMBROS VÃO USAR

Será um link que abre no navegador do celular ou computador, sem instalar
aplicativo. O cadastro já reserva os lugares. A lotação é de 200 pessoas,
incluindo crianças. A secretaria controla o pagamento pelo WhatsApp.

Este pacote contém a aplicação real para publicar no Google. Ele não é
um arquivo de demonstração para abrir com dois cliques. O endereço para
os membros só será criado quando você concluir a publicação abaixo.

VOCÊ VAI CRIAR DOIS PROJETOS NA CONTA DA IGREJA

1. PÚBLICO: cadastro e consulta dos membros; acesso sem login.
2. ADMINISTRAÇÃO: inscrições, vagas, cancelamentos e entrada; login da equipe.

Use a conta porumajornadafeliz@gmail.com. A planilha será criada pela
configuração, sem dados de exemplo. Não precisa instalar programas,
executar comandos ou contratar hospedagem.

PASSO 1 — BAIXAR E EXTRAIR

Extraia o ZIP PUBLICAR-CEIA-IPDIV-2026.zip em uma nova pasta.
Você encontrará:

  PUBLICO/Code.gs
  PUBLICO/appsscript.json
  ADMINISTRACAO/Code.gs
  ADMINISTRACAO/appsscript.json
  COMECE-AQUI.txt
  LICENCAS.txt

Abra os arquivos Code.gs e appsscript.json com o Bloco de Notas para copiar
o conteúdo. Se o Windows não reconhecer a extensão, use botão direito,
Abrir com, Bloco de Notas. Copie o conteúdo inteiro, sem copiar o nome do
arquivo. O logo, a página e os botões já estão incorporados no Code.gs.

PASSO 2 — CRIAR O PROJETO PÚBLICO

1. Acesse https://script.google.com/ e confirme a conta da igreja no avatar.
2. Clique em Novo projeto. Dê o nome "Ceia IPDiv 2026 — Público".
3. No arquivo Code.gs do editor, selecione tudo e substitua pelo conteúdo
   inteiro de PUBLICO/Code.gs deste pacote. Salve e aguarde o editor terminar.
4. Abra Configurações do projeto (engrenagem) e habilite a opção para
   mostrar o arquivo de manifesto appsscript.json no editor.
5. Volte ao Editor. Abra appsscript.json e substitua seu conteúdo pelo
   conteúdo de PUBLICO/appsscript.json deste pacote. Salve.
6. Na lista de funções, perto de Executar, selecione prepararPublicacao_
   (o nome termina com sublinhado). Clique em Executar e autorize seu
   próprio projeto a criar/acessar a planilha.
7. A execução cria a planilha "Ceia IPDiv 2026 — Inscrições", configura a
   conta da igreja como administradora e prepara os acessos. No registro
   da execução aparecerão o endereço da planilha, zero inscrições e 200 vagas.
   Se executar novamente, reutiliza a planilha e preserva os dados.
8. Confira no Google Planilhas que a planilha está com acesso geral Restrito.
   Não compartilhe a planilha com os membros nem a publique na Web.
9. No editor do projeto público, abra Implantar > Nova implantação.
   No tipo, selecione Aplicativo da Web e configure:
      Executar como: Eu (a conta da igreja).
      Quem pode acessar: Qualquer pessoa, incluindo sem login Google.
10. Clique em Implantar. Copie o URL do aplicativo da Web terminado em /exec.
    ESTE É O LINK PÚBLICO. Guarde, mas ainda não divulgue aos membros.
11. Abra esse link numa janela anônima. Deve aparecer o logo e o contador
    com 200 vagas, sem pedido de login e sem inscrições de exemplo.

PASSO 3 — CRIAR O PROJETO ADMINISTRATIVO

Mantenha o projeto público aberto em uma aba e crie outro projeto:

1. Em https://script.google.com/, clique em Novo projeto e dê o nome
   "Ceia IPDiv 2026 — Administração".
2. Substitua o Code.gs pelo conteúdo de ADMINISTRACAO/Code.gs. Salve.
3. Mostre o manifesto nas configurações, como antes, e substitua seu
   appsscript.json pelo conteúdo de ADMINISTRACAO/appsscript.json. Salve.
4. Na aba do projeto PÚBLICO, abra Configurações > Propriedades do script.
   Localize ADMIN_BRIDGE_SECRET e copie seu valor de forma privada.
5. Nas Propriedades do script do projeto ADMINISTRATIVO, adicione:
      PUBLIC_WEB_APP_URL = o link público /exec do Passo 2.
      ADMIN_BRIDGE_SECRET = o mesmo valor copiado do projeto público.
   Salve as propriedades. Não envie a chave por WhatsApp ou por esta conversa.
6. Abra Implantar > Nova implantação > Aplicativo da Web e configure:
      Executar como: Usuário que acessa o aplicativo da Web.
      Quem pode acessar: contas Google, conforme a opção disponível.
   Não selecione "Eu" para executar o projeto administrativo.
7. Implante e copie o URL terminado em /exec.
   ESTE É O LINK ADMINISTRATIVO, exclusivo da secretaria/equipe.
8. Abra o link com porumajornadafeliz@gmail.com e autorize o projeto.
   Você deverá ver o painel Inscrições e vagas vazio e 200 vagas restantes.

PASSO 4 — CONFERIR ANTES DE DIVULGAR

1. Pelo link público, registre uma inscrição identificada como teste,
   com um participante. O contador deve cair de 200 para 199 e o link
   individual deve ficar disponível, sem exigir confirmação de pagamento.
2. Pelo link administrativo, confirme que a mesma inscrição aparece.
3. Confira o destino (37) 3212-4980 e o texto preparado no WhatsApp.
   Não é necessário enviar a mensagem nem fazer pagamento neste teste.
4. Cancele essa inscrição pelo painel, com o motivo "Teste de publicação".
   O contador deve voltar a 200. A lista Ativas ficará vazia e o histórico
   de teste permanecerá no filtro Canceladas, sem ocupar vagas.
5. Confira os valores, a programação e o favorecido do Pix no aplicativo
   do banco, sem concluir pagamento se não houver essa intenção.
6. Teste o link público no celular. Todos os aparelhos devem consultar
   o mesmo contador, atualizado a cada 30 segundos ou em Atualizar vagas.

PRONTO PARA COMPARTILHAR

Envie aos membros somente o LINK PÚBLICO /exec do Passo 2. Cada família
terá seu link particular após registrar. O endereço de uma inscrição
individual e o link administrativo não devem ser usados como convite geral.

Texto para WhatsApp (substitua o campo pelo URL público real):

Ceia de Confraternização IPDiv 2026
Faça sua inscrição: [COLE AQUI O LINK PÚBLICO]
Inscrições até 20/12/2026. Vagas limitadas a 200 pessoas, incluindo crianças.
Culto de Ações de Graças em 31/12, às 20h30min, no Templo da IPDiv —
Av. Paraná, 1098, Sidil. Ceia após o culto, no Salão Imperatriz.
Pagamento e atendimento com a secretaria: (37) 3212-4980 (WhatsApp).

EQUIPE E ATUALIZAÇÕES

A conta da igreja já fica autorizada como admin. Para outras pessoas,
altere ADMIN_ACCOUNTS nas propriedades do projeto PÚBLICO, incluindo o
email com o papel admin, treasury (Secretaria) ou door (Entrada).
Não compartilhe senhas ou edição da planilha/projetos com os operadores.

Para atualizar o código depois, use Nova versão da implantação existente
em Implantar > Gerenciar implantações > Editar. Isso preserva os links.
Salvar apenas no editor não atualiza a versão acessada pelos membros.

Se já houver uma instalação com arquivos separados, mantenha-a como
explicado em docs/PUBLICACAO.md do pacote completo. Não misture os arquivos
separados com o Code.gs consolidado no mesmo projeto: isso duplicaria funções.
