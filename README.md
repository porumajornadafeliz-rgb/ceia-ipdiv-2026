# Ceia de Confraternização IPDiv 2026

Sistema de inscrição familiar e entrada da **Igreja Presbiteriana de Divinópolis**, em **31/12/2026**. Culto de Ações de Graças às **20h30min**, no **Templo da IPDiv — Av. Paraná, 1098 — Sidil**. Ceia **após o culto, no Salão Imperatriz**, Rua Duarte, 70, Bairro Catalão, esquina com a Rua Paraná. Inscrições até **20/12/2026, às 23h59 (Brasília)**.

**Registrar reserva os lugares; confirmar a primeira parcela garante as vagas.** São 200 pessoas, incluindo crianças. À vista até 20/12, 2x em 20/11 e 20/12 ou 3x em 25/10, 20/11 e 20/12, com o mesmo total. Parcelas vencidas são cobradas juntas. Pix ou depósito na conta Itaú da igreja, com comprovantes privados e conferência pela secretaria. Sem contratação de API: lembretes de amanhã aparecem no painel para envio manual pelo WhatsApp.

O sistema inicia **sem inscrições e sem exemplos fictícios**, com **200 vagas disponíveis**. A inicialização de uma planilha existente preserva seus registros e históricos; não apaga inscrições reais.

**Atualização atual: escolha de pagamento simplificada no Público.** Use [o guia](docs/ATUALIZAR-PAGAMENTO-SIMPLIFICADO.md) e `entrega/ATUALIZAR-PAGAMENTO-SIMPLIFICADO-IPDIV-2026.zip`. Primeiro aparecem apenas À vista, 2x, 3x e Continuar; escolher revela os valores e datas, e continuar abre Pix/depósito/comprovante. A conclusão do painel administrativo ficou para a próxima etapa. Os testes locais não alteram o Google da igreja.

## Analisar sem instalar nada

Baixe **`entrega/DEMONSTRACAO-IPDIV-v12.zip`** pelo GitHub, use **Extrair Tudo** no Windows e abra **`ABRIR-DEMONSTRACAO.html`** com dois cliques, no Edge ou Chrome.

A demonstração começa vazia. Você pode registrar uma família e ver a baixa imediata das vagas, visualizar a mensagem da secretaria, salvar o PDF, consultar inscrições, cancelar/reativar e registrar a entrada. O painel **Inscrições e vagas** substitui a antiga tesouraria.

É uma análise local: os testes ficam apenas na aba e são descartados ao fechar/recarregar. Não grava no Google, não envia WhatsApp real e não permite pagamento real. A versão publicada usa a mesma interface com armazenamento compartilhado no Google Planilhas e abre o WhatsApp com os dados para o participante conferir e enviar.

## Funcionalidades

- Contador público visível ao abrir, atualizado após o cadastro, ao voltar à aba e a cada 30 segundos com a página visível.
- Nome do responsável, telefone com máscara automática e quantidades em cinco categorias, com valores calculados no servidor.
- Categoria **Cônjuge adulto não-membro da igreja**, R$ 80 por pessoa, limitada a um cônjuge e com adulto membro na inscrição.
- Vagas verificadas no servidor sob o mesmo bloqueio da gravação; uma família inteira é aceita ou recusada, sem ultrapassar a lotação.
- Repetir o mesmo envio não cria inscrição nem baixa vagas em duplicidade, mesmo após perda de conexão, prazo ou esgotamento.
- Consulta por nome e WhatsApp e registro para salvar em PDF legível no celular ou imprimir, identificado como **não sendo comprovante de pagamento**. O PDF mantém acesso particular clicável; a tela não pede guardar ou copiar link.
- WhatsApp preparado com nome, telefone, inscrição, participantes, categorias, plano, recebido e saldo. Não inclui o token privado e distingue valores conferidos de pagamentos pendentes.
- À vista, 2x e 3x, Pix ou depósito, pagamentos vencidos juntos, comprovantes e conferência por pagamento. Não usa API bancária.
- Administração com login Google e papéis autorizados; pesquisa, filtros, recebido/saldo, CSV de inscrições e parcelas, lembretes manuais, impressão e histórico.
- Cancelamento e reativação com motivo e auditoria. Cancelar libera lugares; reativar exige disponibilidade para toda a família. Registros não são apagados.
- Entrada familiar exige quitação integral confirmada; cancelamentos e entradas duplicadas são bloqueados no servidor.

## Publicação e operação

Para a instalação do zero, baixe **`entrega/PUBLICAR-CEIA-IPDIV-2026-v2.zip`**. Ele contém os dois projetos consolidados, cada um com apenas `Code.gs` e `appsscript.json`, e o guia **`COMECE-AQUI.txt`**. A função `prepararPublicacao`, protegida por verificação da conta proprietária, executada no editor pelo proprietário, cria a planilha vazia automaticamente e preserva registros em novas execuções. Leia também [Colocar no ar, passo a passo](docs/COLOCAR-NO-AR.md).

Depois da publicação, haverá um **link público** para os membros e um **link administrativo** para a equipe. Ambos abrem no navegador, sem instalar aplicativo. O endereço público só é criado pelo Google ao implantar; nenhum link de download ou de demonstração deve ser divulgado como inscrição real.

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

O build gera `dist/public`, `dist/admin`, `dist/publicacao` e o HTML autônomo. `npm run dev` oferece somente uma demonstração de loopback em memória, na porta 4173, com administração em `/admin`; não recebe inscrições reais.

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
