# Ceia de Confraternização IPDiv 2026

Sistema de inscrição familiar e entrada da **Igreja Presbiteriana de Divinópolis**, em **31/12/2026**. Culto de Ações de Graças às **20h30min**, no **Templo da IPDiv — Av. Paraná, 1098 — Sidil**. Ceia **após o culto, no Salão Imperatriz**, Rua Duarte, 70, Bairro Catalão, esquina com a Rua Paraná. Inscrições até **20/12/2026, às 23h59 (Brasília)**.

**Regra atual: registrar a inscrição já reserva as vagas.** A lotação é de **200 pessoas**, contando adultos e crianças. Não há confirmação financeira no sistema: a secretaria controla o pagamento pelo WhatsApp **(37) 3212-4980**. Copiar o link, abrir o WhatsApp ou registrar a entrada não desconta lugares novamente.

O sistema inicia **sem inscrições e sem exemplos fictícios**, com **200 vagas disponíveis**. A inicialização de uma planilha existente preserva seus registros e históricos; não apaga inscrições reais.

**Código implementado e testado localmente. A publicação no Google da Igreja ainda está pendente.** O pacote não cria uma implantação pública nem conecta a conta `porumajornadafeliz@gmail.com` automaticamente.

## Analisar sem instalar nada

Baixe **`entrega/DEMONSTRACAO-IPDIV-v6.zip`** pelo GitHub, use **Extrair Tudo** no Windows e abra **`ABRIR-DEMONSTRACAO.html`** com dois cliques, no Edge ou Chrome.

A demonstração começa vazia. Você pode registrar uma família e ver a baixa imediata das vagas, visualizar a mensagem da secretaria, copiar o link, consultar inscrições, cancelar/reativar e registrar a entrada. O painel **Inscrições e vagas** substitui a antiga tesouraria.

É uma análise local: os testes ficam apenas na aba e são descartados ao fechar/recarregar. Não grava no Google, não envia WhatsApp real e não permite pagamento real. A versão publicada usa a mesma interface com armazenamento compartilhado no Google Planilhas e abre o WhatsApp com os dados para o participante conferir e enviar.

## Funcionalidades

- Contador público visível ao abrir, atualizado após o cadastro, ao voltar à aba e a cada 30 segundos com a página visível.
- Nome do responsável, telefone com máscara automática e quantidades em cinco categorias, com valores calculados no servidor.
- Categoria **Cônjuge adulto não-membro da igreja**, R$ 80 por pessoa, limitada a um cônjuge e com adulto membro na inscrição.
- Vagas verificadas no servidor sob o mesmo bloqueio da gravação; uma família inteira é aceita ou recusada, sem ultrapassar a lotação.
- Repetir o mesmo envio não cria inscrição nem baixa vagas em duplicidade, mesmo após perda de conexão, prazo ou esgotamento.
- Link privado disponível imediatamente; consulta sem login; registro para salvar ou imprimir, identificado como **não sendo comprovante de pagamento**.
- WhatsApp preparado com nome, telefone, inscrição, participantes, categorias e valor. Não inclui o token privado nem afirma que houve pagamento.
- Pix estático opcional para facilitar o pagamento, com conferência financeira diretamente pela secretaria. Não usa API bancária.
- Administração com login Google e papéis autorizados; pesquisa, filtros, valores de referência, CSV, impressão e histórico.
- Cancelamento e reativação com motivo e auditoria. Cancelar libera lugares; reativar exige disponibilidade para toda a família. Registros não são apagados.
- Entrada familiar sem exigir pagamento confirmado; cancelamentos e entradas duplicadas são bloqueados no servidor.

## Publicação e operação

- [Publicar gratuitamente no Google](docs/PUBLICACAO.md)
- [Operar inscrições, secretaria e entrada](docs/OPERACAO.md)
- [Segurança e limites](docs/SEGURANCA.md)
- [Testes e validação](docs/TESTES.md)

A hospedagem usa Google Apps Script e uma planilha privada, dentro das cotas gratuitas da conta Google. O painel administrativo não exige compartilhar a planilha com a equipe. Os segredos ficam nas propriedades dos projetos.

## Desenvolvimento

Node.js 22 ou superior para gerar/testar; o sistema publicado não depende de Node.js.

```sh
npm ci
npm run build
npm test
npm run test:browser
npm run test:offline
```

O build gera `dist/public`, `dist/admin` e o HTML autônomo. `npm run dev` oferece somente uma demonstração de loopback em memória, na porta 4173, com administração em `/admin`; não recebe inscrições reais.

O logotipo oficial da **página 1** do PDF fornecido está em `assets/logo.png`, com original preservado em `assets/logo-original.pdf`. É incorporado nas páginas sem depender do Canva ou de hospedagem externa.

```text
src/shared/   Regras, armazenamento, Pix e recursos visuais
src/public/   Cadastro, consulta e canal administrativo assinado
src/admin/    Interface administrativa e identidade Google
scripts/      Build e demonstrações locais sem dados iniciais
tests/        Verificações de regras, permissões, vagas e navegador
docs/         Publicação, operação, segurança e validação
```

Não é necessário criar worktrees: cada tarefa na nuvem possui ambiente isolado; use o checkout existente.
