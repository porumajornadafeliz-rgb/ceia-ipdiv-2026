# Ceia de Confraternização IPDiv 2026

Sistema de inscrição familiar, Pix, tesouraria e entrada para a **Igreja Presbiteriana de Divinópolis**, em **31/12/2026**. O **Culto de Ações de Graças será às 20h30min**, no **Templo da IPDiv — Av. Paraná, 1098 — Sidil**. A **ceia será após o culto, no Salão Imperatriz**. Inscrições até **20/12/2026, às 23h59 (Brasília)**.

Funciona no navegador do celular, sem instalar aplicativo. A hospedagem é o Google Apps Script, com Google Planilhas e Google Drive privados, dentro das cotas gratuitas de uma conta Google comum. Não usa serviço pago, cartão, API bancária nem serviço externo para gerar QR Codes.

**Código implementado e testado localmente. Ainda precisa ser publicado e validado na conta Google da Igreja antes de compartilhar o link. Não há uma implantação pública criada por este repositório.**

Conta informada para publicação e administração: **`porumajornadafeliz@gmail.com`**. A primeira inicialização prepara essa conta como administradora quando ainda não existe uma lista de contas permitidas. Permissões já configuradas são preservadas. O e-mail não substitui o login e a autorização Google na publicação.

- [Publicação gratuita, passo a passo](docs/PUBLICACAO.md)
- [Operação da tesouraria e da entrada](docs/OPERACAO.md)
- [Segurança, arquitetura e limites](docs/SEGURANCA.md)
- [Testes e validação antes do uso](docs/TESTES.md)

## Abrir para analisar, sem instalar nada

Baixe `entrega/DEMONSTRACAO-IPDIV.zip` pelo GitHub e use **Extrair Tudo** no Windows. Abra o arquivo **`ABRIR-DEMONSTRACAO.html`** com dois cliques, no Microsoft Edge ou no Google Chrome.

Os botões no topo alternam entre **Inscrição**, **Tesouraria** e **Entrada**. Há exemplos fictícios no painel; você também pode cadastrar uma família de teste, simular a conferência do pagamento e registrar a entrada. O logotipo oficial está incluído.

Essa demonstração é um arquivo HTML autônomo e não precisa de internet, Node.js ou conta Google. Use dados fictícios. Fechar ou recarregar apaga os testes. O QR exibido nela contém apenas um aviso de demonstração, sem um Pix válido para pagamento. A versão real continua sendo publicada em Google Apps Script conforme o guia.

## O que está incluído

- Formulário público sem login Google; nome do responsável, WhatsApp com formatação automática ao digitar/apagar/colar e quantidades.
- Limite de **200 pessoas**, incluindo crianças, com contador público de vagas restantes. Inscrições pendentes não garantem lugar; a vaga é descontada quando o pagamento é confirmado pela tesouraria.
- Cinco categorias, contadores, preço calculado no servidor e resumo antes de confirmar.
- Regra de um cônjuge não membro por inscrição, somente com adulto membro.
- Encerramento automático de novas inscrições ao fim de 20/12/2026, horário de Brasília. Consultas, pagamentos e administração continuam funcionando.
- Envios repetidos com o mesmo identificador não criam outra inscrição, inclusive após falha de conexão.
- Pix BR Code com CNPJ, valor exato, TxId da inscrição e CRC16; QR gerado no próprio navegador, sem transmitir dados a terceiros.
- Contato da secretaria pelo WhatsApp **(37) 3212-4980**, com mensagem preparada para o participante conferir e enviar: nome, inscrição, participantes, valor e situação pendente de conferência, sem incluir o token privado.
- Link privado com token, aviso de Pix realizado e comprovante **opcional** em PDF/JPG/PNG de até 1 MB, guardado no Drive privado.
- Confirmação **manual** do recebimento pela tesouraria. Nem o aviso nem o arquivo do participante mudam o pagamento para pago.
- Confirmação de inscrição paga para salvar em texto, imprimir em PDF ou compartilhar pelo recurso do celular.
- Login Google administrativo, lista de contas permitidas e papéis de tesouraria, entrada e administrador.
- Pesquisa por responsável, telefone ou inscrição, filtros, check-in de toda a família com um clique, bloqueio de duplicação e exceção auditada exclusiva de administrador.
- Indicadores, histórico de alterações, CSV e impressão da lista filtrada para contingência.

## Preparar os arquivos

Requer Node.js 22 ou superior apenas para gerar e testar os arquivos. O sistema publicado não depende de Node.js.

```sh
npm ci
npm run build
npm test
```

O build gera dois conjuntos independentes em `dist/public` e `dist/admin`, prontos para copiar no editor do Apps Script. A publicação pelo editor é gratuita e não exige CLI nem conta em outra plataforma.

### Logotipo oficial

O logotipo oficial já está incluído em **`assets/logo.png`**, convertido exclusivamente da **página 1** do PDF enviado pela Igreja. O original está preservado em `assets/logo-original.pdf`.

O comando `npm run build` incorpora a imagem nas páginas pública e administrativa, sem depender do Canva, de um endereço público ou de um serviço de imagens. O desenho, as cores e as proporções originais foram preservados. Veja [assets/README.md](assets/README.md).

### Desenvolvimento local

```sh
npm run build
npm run dev
```

A demonstração atende somente à interface de loopback na porta 4173. A área administrativa fica em `/admin`. Usa dados em memória e identidade simulada, exibe um aviso de demonstração e **não pode receber inscrições ou pagamentos reais**. Reiniciar apaga os dados. O simulador não é incluído nas implantações Apps Script.

```sh
# Usa Chromium instalado no sistema; é possível indicar outro executável.
CHROMIUM_PATH=/usr/bin/chromium npm run test:browser
```

## Organização do código

```text
src/shared/     Regras, Pix, armazenamento e recursos visuais compartilhados
src/public/     Aplicação pública, arquivos privados e canal administrativo assinado
src/admin/      Interface administrativa e autenticação Google no servidor
scripts/        Build e demonstração local
tests/          Testes de regras, APIs, permissões e navegador
docs/           Publicação, operação, segurança e validação
```

O servidor público é o único que acessa a planilha e o Drive. O projeto administrativo identifica a conta Google no servidor e encaminha operações assinadas. Assim, nem o conferencista nem a tesouraria precisam de acesso de edição à planilha ou ao projeto público. Os segredos ficam nas propriedades dos scripts, nunca no HTML, no Git ou no navegador.

Não é necessário criar worktrees: cada tarefa na nuvem já possui um ambiente isolado; use o checkout existente.
