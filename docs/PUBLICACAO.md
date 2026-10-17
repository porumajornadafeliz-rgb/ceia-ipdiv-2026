# Publicar gratuitamente na conta Google da Igreja

A publicação é feita por um responsável autorizado na própria conta Google. Não envie senhas, tokens ou a chave de comunicação em conversas. Separe cerca de 30 minutos para configuração e testes. Use uma conta da Igreja para que o sistema não dependa da conta pessoal de um voluntário.

**Conta informada para este projeto: `porumajornadafeliz@gmail.com`.** Use essa conta para criar a planilha e os dois projetos Apps Script. O código já prepara essa conta com o papel `admin` na primeira inicialização; informar o e-mail não conecta ou autoriza a conta Google automaticamente.

## Instalação do zero com poucos arquivos

Use **`entrega/PUBLICAR-CEIA-IPDIV-2026-v2.zip`** e o guia [COLOCAR-NO-AR.md](COLOCAR-NO-AR.md). Cada projeto está consolidado em um `Code.gs` e um `appsscript.json`. Execute **`prepararPublicacao`** no editor do projeto público para criar a planilha vazia automaticamente, sem precisar copiar seu ID. A função usa a planilha já configurada se for executada novamente e nunca inclui exemplos.

Não misture o `Code.gs` consolidado com os arquivos separados abaixo no mesmo projeto, pois isso duplicaria funções. Os dois formatos usam as mesmas regras e interfaces.

## 1. Gerar os arquivos e incorporar a marca

No projeto local, com Node.js 22 ou superior:

```sh
npm ci
# O logotipo oficial da página 1 do PDF já está incluído em assets/logo.png.
npm run build
npm test
```

Há duas pastas geradas: `dist/public` e `dist/admin`. Se recebeu o pacote de entrega, os arquivos já gerados também estão nele. O projeto público contém a biblioteca QR local e a licença é preservada em `dist/licenses`.

O logotipo oficial já está incorporado no arquivo `Brand.html` dos dois projetos. Ele foi obtido somente da página 1 do PDF fornecido. Não é necessário acessar o Canva, publicar a imagem ou configurar acesso ao Drive para exibir a marca.

## 2. Criar a planilha privada

1. Abra Google Planilhas e crie **Ceia IPDiv 2026 — Inscrições**.
2. Em **Compartilhar**, mantenha **Acesso geral: Restrito**. Não use “Publicar na Web”.
3. Copie somente o ID que aparece entre `/d/` e `/edit` no endereço da planilha.
4. Não compartilhe a planilha com a equipe de entrada ou tesouraria. O painel fornece o acesso necessário. Apenas o proprietário e eventuais mantenedores técnicos devem ter edição direta.

## 3. Criar o projeto PÚBLICO

1. Em `script.google.com`, crie um **Novo projeto**, com o nome **Ceia IPDiv 2026 — Público**. Use um projeto independente, não vinculado à planilha.
2. Remova o `Code.gs` vazio. Copie cada arquivo de `dist/public` para o editor. Arquivos `.gs` são do tipo **Script**; arquivos `.html` são do tipo **HTML**. O nome no editor não precisa da extensão ao criar.
3. Em **Configurações do projeto**, habilite **Mostrar o arquivo de manifesto appsscript.json no editor**. Substitua seu conteúdo pelo arquivo gerado. Não crie um arquivo de script chamado `appsscript.json`.
4. Ainda em **Configurações do projeto → Propriedades do script**, adicione:

| Propriedade | Valor |
|---|---|
| `SPREADSHEET_ID` | ID da planilha privada criada acima |
| `MAX_PARTICIPANTS` | `200` — lotação total, contando adultos e crianças. A inicialização cria esse valor quando ausente. |
| `SEAT_POLICY` | `REGISTERED` — reservar lugares ao registrar a inscrição. A inicialização atualiza a regra antiga para esta nova regra, sem apagar registros. |
| `ADMIN_ACCOUNTS` | Opcional no primeiro uso: a inicialização configura a conta abaixo como administradora. Se a propriedade já existir, confira ou acrescente a conta sem remover os demais acessos necessários. |

Configuração inicial preparada para a Igreja:

```json
{
  "porumajornadafeliz@gmail.com": "admin"
}
```

`admin` gerencia inscrições, cancelamentos, reativações e entradas. `treasury` corresponde à Secretaria: gerencia inscrições e relatórios. `door` pesquisa e registra a entrada das inscrições ativas, sem exigir confirmação de pagamento. Uma conta precisa de somente um papel; use `admin` quando precisar das duas áreas.

Para outras pessoas, acrescente seus e-mails reais ao mesmo JSON com `treasury` ou `door`. Não é preciso fornecer senha. O arquivo `Config.gs` define os valores iniciais: após a primeira configuração, a lista efetiva é a propriedade `ADMIN_ACCOUNTS`, que nunca é sobrescrita pela inicialização.

5. Salve tudo. Selecione **`prepararPublicacao`** no editor e clique em **Executar**, como proprietário. Autorize o acesso a Planilhas e a identificação da conta proprietária. A função verifica a identidade da conta proprietária no servidor antes de configurar; visitantes não podem executá-la.
6. Ela cria a aba `Inscricoes` e o cabeçalho, sem incluir famílias de exemplo. Numa atualização, acrescenta a coluna `cancelledAt` ao cabeçalho anterior compatível. Não apaga nem altera os registros existentes; estruturas incompatíveis são recusadas.
7. Confira as propriedades geradas: `TOKEN_SECRET`, `ADMIN_BRIDGE_SECRET`, **`MAX_PARTICIPANTS=200`** e **`SEAT_POLICY=REGISTERED`**. **Não altere `TOKEN_SECRET` após iniciar inscrições**, pois ele é usado para repetir envios com segurança. Não exponha nenhum segredo. Pastas e comprovantes privados de versões anteriores permanecem no Drive, sem uso pelo sistema atual e sem serem apagados.
8. Vá a **Implantar → Nova implantação → Aplicativo da Web**:
   - **Executar como: Eu**, a conta proprietária da Igreja.
   - **Quem pode acessar: Qualquer pessoa**, incluindo quem não tem login Google. Não escolha apenas “qualquer pessoa com uma conta Google”.
9. Implante e copie o endereço terminado em **`/exec`**. Esse é o link público que será compartilhado pelo WhatsApp **depois dos testes**. Não use `/dev`.

Se a conta não oferecer acesso anônimo, investigue as políticas da organização ou use a conta Google comum da Igreja autorizada para isso. Não torne a planilha pública como alternativa.

## 4. Criar o projeto ADMINISTRATIVO

1. Crie outro projeto independente: **Ceia IPDiv 2026 — Administração**.
2. Copie os arquivos de `dist/admin`, incluindo o manifesto, como no passo anterior. Não copie `Storage.gs`, `Public.gs`, `Bridge.gs` ou `Pix.gs` para esse projeto.
3. Em **Propriedades do script**, adicione:

| Propriedade | Valor |
|---|---|
| `PUBLIC_WEB_APP_URL` | Endereço `/exec` da implantação pública |
| `ADMIN_BRIDGE_SECRET` | Exatamente o valor da propriedade de mesmo nome no projeto público, copiado de forma privada |

4. Vá a **Implantar → Nova implantação → Aplicativo da Web**:
   - **Executar como: Usuário que acessa o aplicativo da Web**.
   - **Quem pode acessar:** contas Google, conforme a opção disponível na conta. A lista `ADMIN_ACCOUNTS` recusa qualquer conta não autorizada em cada operação.
5. Copie o endereço `/exec` administrativo e compartilhe **somente com a equipe**.
6. Cada integrante abre esse link com sua conta Google e autoriza o acesso solicitado: sua identidade/e-mail e comunicação externa. Não precisa de permissão na planilha nem de edição nos projetos.

**Não publique a administração executando como proprietário.** A identidade deve ser fornecida pelo Google no servidor. Se ela não estiver disponível, o sistema bloqueia o acesso; não existe senha genérica ou campo para digitar um e-mail e entrar.

O projeto público executa as operações assinadas em nome do proprietário. A assinatura usa uma chave privada compartilhada apenas entre os servidores. Papéis e contas permitidas são conferidos novamente no projeto público. Nunca inclua essa chave no HTML.

Se o Google solicitar configuração da tela de consentimento OAuth ou usuários de teste, siga o fluxo da própria conta/projeto e inclua apenas a equipe administrativa. Não avance ignorando avisos de um aplicativo desconhecido: o proprietário deve confirmar que se trata do projeto da Igreja. Configurações de teste podem exigir nova autorização após sua validade; teste com todas as contas antes do evento. Restrições de organização ou exigências de verificação podem precisar de ação do administrador da conta Google.

## 5. Testar antes de compartilhar pelo WhatsApp

Siga a lista de [TESTES.md](TESTES.md), **incluindo contas de tesouraria e entrada separadas e uma conta não autorizada**. O teste local não substitui a conferência da implantação, da identidade Google e da conta bancária.

A secretaria faz o controle de pagamento diretamente pelo WhatsApp. A reserva de lugares acontece no cadastro, sem confirmação financeira. Não é necessário contratar ou habilitar uma API Pix para este fluxo.

Confira os dados Pix opcionais antes de divulgar: chave **20.896.270/0001-30**, favorecido **Igreja Presbiteriana de Divinópolis**, Itaú, agência **0690**, conta **16405-8**, e valor correto no aplicativo do banco. O registro da inscrição não comprova pagamento.

Depois dos testes, compartilhe apenas o endereço público `/exec` com os participantes. O link administrativo permanece restrito à equipe.

## 6. Atualizar e operar

Para atualizar uma implantação anterior para a regra de vagas por inscrição, copie os arquivos atualizados dos dois projetos e execute `prepararPublicacao` novamente no projeto público. Ela acrescenta a coluna `cancelledAt`, configura `SEAT_POLICY=REGISTERED` e preserva registros, históricos, segredos e permissões. Confira `MAX_PARTICIPANTS=200` antes de publicar a nova versão. Todos os registros existentes não cancelados passam a ocupar lugares, independentemente do pagamento. Use o painel para cancelar inscrições de teste identificadas, sem apagar linhas manualmente.

Após editar código, gere os arquivos novamente, copie os arquivos alterados no projeto correspondente e publique uma **nova versão da implantação existente** em **Implantar → Gerenciar implantações → Editar → Nova versão**. Isso preserva os endereços `/exec`. Salvar no editor sozinho não atualiza a versão pública.

- Para adicionar/remover contas, altere `ADMIN_ACCOUNTS` **no projeto público**. A alteração vale nas chamadas seguintes; não precisa entregar acesso à planilha.
- Não compartilhe o editor de nenhum projeto com usuários operacionais. Quem edita código/propriedades possui poder de administrador técnico.
- Não altere a ordem das colunas, não ordene/remova linhas manualmente, não renomeie a aba `Inscricoes` e não escreva situações diretamente nas células.
- Não mova a implantação para outra conta sem revisar autenticação, permissões, propriedades e URLs.
- Não troque os segredos ou IDs como tentativa genérica de consertar acesso: confira primeiro a mensagem e as configurações.
- O pacote gerado não contém as propriedades ou credenciais da Igreja. Guarde-as apenas nas configurações privadas dos projetos.
