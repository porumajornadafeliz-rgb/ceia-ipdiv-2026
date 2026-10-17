# Operação da ceia

Em **31/12/2026**, o **Culto de Ações de Graças** será às **20h30min**, no **Templo da IPDiv — Av. Paraná, 1098 — Sidil, Divinópolis, MG**. A **ceia será após o culto, no Salão Imperatriz**, na Rua Duarte, 70, Bairro Catalão, esquina com a Rua Paraná. O aviso de inscrição até **20/12/2026, às 23h59 (Brasília)** aparece em destaque antes do botão principal e no formulário. A programação também consta da confirmação para salvar ou imprimir.

## Vagas e confirmação

A lotação é de **200 pessoas**, incluindo crianças de todas as categorias. O contador público mostra as vagas restantes e a hora da consulta. Atualiza ao abrir, ao voltar à aba, antes de conferir a inscrição, após consultar o pagamento e a cada 60 segundos com a página visível. O botão **Atualizar vagas** permite consultar a qualquer momento. A disponibilidade pode mudar entre consultas; o servidor verifica novamente antes de gravar um cadastro ou confirmar um pagamento.

**Inscrições pendentes não garantem lugar.** Criar uma inscrição, clicar em “Já fiz o Pix” ou enviar comprovante não desconta vagas. A vaga é contabilizada quando a tesouraria confirma o recebimento no painel. Adultos e crianças têm o mesmo peso no limite, independentemente do preço. O sistema confirma toda a família ou recusa a confirmação se não houver lugar para todos; não faz confirmação parcial. Ao esgotar a lotação, bloqueia novos cadastros e oculta o Pix de consultas ainda pendentes. A consulta de inscrições já existentes e o contato com a secretaria continuam disponíveis.

O Pix é estático: um código já copiado não pode ser revogado, e o sistema não controla transferências feitas no banco. Se chegar um pagamento que não possa ser confirmado por falta de vagas, a secretaria deve tratar a situação com o participante e a tesouraria, inclusive eventual devolução pelo banco. Não existe devolução automática nem fila de espera nesta versão.

Desfazer um pagamento antes da entrada libera os lugares. Uma liberação excepcional de entrada pelo administrador também ocupa os lugares físicos e respeita o limite, mesmo com pagamento pendente; não é contada novamente se o pagamento for confirmado depois.

## Participante

1. Abre o link público recebido pelo WhatsApp.
2. Toca **FAZER MINHA INSCRIÇÃO**, informa nome e WhatsApp com DDD e ajusta as quantidades. O telefone se organiza automaticamente enquanto digita, como `(37) 99999-9999`, aceitando também números fixos, como `(37) 3212-4980`.
3. Confere o resumo. Crianças têm até 12 anos inclusive em 31/12/2026; com 13 anos ou mais aplica-se a tarifa adulta. Filhos não membros usam a tarifa de não membro. Um cônjuge adulto não membro pode pagar R$ 80 se houver um adulto membro na mesma inscrição.
4. Confirma e gera o Pix. O sistema calcula valores no servidor; mudar o código no navegador não muda o preço aceito.
5. Guarda o **link individual**. Ele contém um token privado e permite acompanhar a situação sem login. Não publique esse link em grupos.
6. Confere o favorecido no banco, faz o Pix e, se quiser, toca **JÁ FIZ O PIX — AVISAR A SECRETARIA — (37) 3212-4980 (ZAP)**. O sistema registra o aviso e abre uma mensagem no WhatsApp da secretaria; o participante precisa conferir a mensagem e tocar em **Enviar**. A mensagem contém nome, número da inscrição, quantidade de participantes, valor e a situação **PENDENTE — aguardando conferência bancária**, deixando explícito que o participante declarou ter feito o Pix e que isso não comprova o recebimento, sem incluir o token privado de consulta. O contato continua disponível para nova tentativa se a pessoa fechar o WhatsApp sem enviar. Pode anexar PDF, JPG ou PNG de até 1 MB. O arquivo não é obrigatório e não confirma pagamento.
7. Aguarda a tesouraria. Quando confirmado, salva, imprime em PDF ou compartilha a confirmação pelo recurso do celular.

O prazo inclui todo o minuto 23h59 de 20/12/2026 em Brasília; bloqueia a partir de 00h00 de 21/12. A consulta pelo link continua disponível. Não basta deixar uma página aberta antes do prazo para se inscrever depois.

Se a conexão falhar, repita o mesmo envio. O botão é desabilitado durante a requisição e o identificador do envio evita duplicação no servidor. Um envio pendente pode ser recuperado na mesma aba com `sessionStorage`; ele é removido após sucesso. Não há rastreadores ou cadastro nominal dos familiares.

Se perder o link, procure a organização para consultar a situação. Não há pesquisa pública por nome ou telefone; o token não é recuperável a partir do seu hash. Nesta versão a equipe pode informar a situação presencialmente, mas não reemitir um token pelo painel. Não refaça uma inscrição já existente apenas por ter perdido o link.

## Tesouraria

1. Entre no link administrativo com a conta Google permitida.
2. Pesquise por nome, WhatsApp ou número, ou filtre **Pendentes**.
3. Confira o **crédito efetivamente recebido** no extrato do Itaú. O aviso e o comprovante são auxiliares, não provas automáticas. O Pix usa valor fixo: em caso de valor divergente, deixe pendente e contate o responsável para regularização. Esta versão não controla parcelas ou pagamentos parciais.
4. Clique **CONFIRMAR PAGAMENTO** e registre uma referência do lançamento (data/horário/identificação suficiente para conciliação). Não copie dados bancários desnecessários para a observação.
5. O sistema grava situação, conta Google, data, horário e referência na mesma alteração da planilha. O comprovante pago fica disponível no link individual quando atualizado.
6. Use **Histórico** para auditar alterações e **Baixar comprovante** para o arquivo opcional. Arquivos são enviados por participantes: abra-os somente com um leitor atualizado e não execute conteúdo recebido.
7. **DESFAZER PAGAMENTO** exige motivo e só é permitido antes de uma entrada já registrada. O histórico anterior é preservado. Se a família já entrou, resolva com a organização sem alterar células ou apagar registros.

Os indicadores representam inscrições e pagamentos confirmados, não a leitura automática da conta bancária. A conciliação do Pix estático é manual; bancos podem exibir o TxId, mas isso não constitui integração bancária.

## Entrada do Salão Imperatriz

1. Entre com a conta permitida de conferencista e abra **Conferência de entrada**.
2. Atualize os dados e pesquise o responsável. A pesquisa ignora acentos no nome e aceita telefone sem pontuação.
3. Confira a quantidade declarada e o pagamento. Inscrições pagas aparecem em destaque e no início da lista.
4. Com pagamento confirmado, toque **CONFIRMAR ENTRADA**. Um clique registra a inscrição familiar inteira; não há leitura de QR ou contagem nominal.
5. A entrada já registrada mostra data/horário. Uma segunda tentativa é bloqueada no servidor, mesmo em outro celular ou com lista desatualizada.
6. Pagamento pendente não pode ser liberado por conferencista. O administrador possui **LIBERAÇÃO EXCEPCIONAL**, com motivo obrigatório e histórico. Essa exceção **não marca o pagamento como pago**.

O número de pessoas nas entradas é estimado pelas quantidades declaradas em cada família. Não representa contagem individual na porta. No celular, deslize horizontalmente a tabela para acessar as demais colunas e ações.

## Relatórios e contingência

- **EXPORTAR RELATÓRIO CSV** exporta a lista conforme os filtros e a pesquisa atuais. Tesouraria inclui valores, categorias e referências de confirmação; entrada inclui apenas seus campos operacionais. Use UTF-8 e separador `;` ao importar. O CSV protege campos que poderiam ser interpretados como fórmulas.
- **IMPRIMIR LISTA FILTRADA** imprime os resultados atuais; escolha **Todas** e limpe a pesquisa se precisar de toda a lista. O navegador também permite salvar em PDF. Indicadores no topo são globais e não mudam com os filtros.
- Antes da abertura do salão, imprima uma lista de inscrições pagas e entradas pendentes. Mantenha-a com a equipe autorizada. Em falta de internet, anote família, horário e operador. Ao voltar a conexão, confira e registre no sistema para evitar entradas em duplicidade entre postos.
- A atualização das listagens administrativas é manual. O contador público de vagas também possui atualização automática a cada 60 segundos com a página visível. As ações sempre conferem novamente o estado atual no servidor.
- Proteja CSVs, PDFs e impressos, pois contêm nomes e telefones. Defina com a Igreja o prazo de retenção e elimine cópias e comprovantes quando deixarem de ser necessários, respeitando a contabilidade.
