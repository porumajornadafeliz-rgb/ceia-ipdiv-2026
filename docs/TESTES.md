# Testes e validação

## Verificado localmente

```sh
npm run build
npm test
npm run test:browser
npm run test:offline
```

`npm test` executa **34 testes** com o código `.gs` real num simulador das APIs Google.

| Área | Cobertura |
|---|---|
| Vagas | 200 iniciais; baixa no registro, incluindo crianças; última vaga; família inteira; esgotamento; cancelamento e reativação |
| Duplicações | Mesmo envio conserva registro/token/vagas; contato, consulta, cópia e entrada não descontam novamente |
| Prazo | Último milissegundo de 20/12 em Brasília; fechamento e retry posterior |
| Valores | Cinco categorias, regra do cônjuge, filhos não membros, quantidades inválidas e total recalculado |
| Pix e QR | Chave, moeda, TxId, valor, CRC conhecido e cálculo independente; decodificação independente por jsQR |
| Links | Token obrigatório; consulta e link disponíveis sem pagamento; dados administrativos não expostos |
| Secretaria | Cancelar/reativar com motivo, conta e auditoria; entrada registrada impede cancelamento |
| Entrada | Não exige confirmação financeira; canceladas e duplicações bloqueadas |
| Autorização | Conta ausente/desconhecida e identidade adulterada; papel door sem poderes de cancelamento ou valores |
| Canal assinado | Assinatura inválida/alterada, expiração e replay depois de reativação |
| Migração | Cabeçalho compatível ampliado; registros, campos financeiros antigos, segredos e permissões preservados |
| Publicação simplificada | Modelos HTML e manifestos preservados; renderização pública e administrativa; canal assinado, vagas, criação inicial sem exemplos e reexecução sem duplicar planilha e função visível recusando visitantes e contas não proprietárias |
| Limpeza | Inicialização sem inscrições, sem exemplos, com 200 vagas; ações financeiras antigas recusadas |

Para os testes de navegador e offline, o executável `pdftotext` (Poppler) deve estar disponível. Ele verifica o conteúdo e os limites das páginas do PDF baixado com um leitor independente.

O teste de navegador percorre o fluxo público e administrativo: início vazio, logo, telefone ao digitar/apagar/colar, resumo, registro com baixa imediata, cópia do link, mensagem WhatsApp sem token e sem afirmar pagamento, Pix decodificado, consulta direta da inscrição já conhecida na mesma aba, PDF legível com link individual clicável, acentos, nomes extensos, caracteres Unicode e todas as categorias, cancelamento/reativação, entrada sem etapa financeira, pesquisa, filtros e CSV. Confere telas de 320 a 1280 pixels e ausência de erros JavaScript. A navegação WhatsApp é interceptada localmente; não acessa o serviço nem envia mensagens reais.

O teste offline verifica o HTML autônomo sem rede: **200 vagas e zero inscrições ao abrir**, ausência das famílias de exemplo antigas, cadastro, link, mensagem simulada, cancelamento/reativação, entrada, lotação e reinício vazio. O Chromium deste ambiente bloqueia `file://`; por isso o mesmo HTML é injetado em uma página vazia, sem servidor. Não é um teste físico de duplo clique no Windows.

Os dados usados pelos testes automatizados são criados durante cada teste e não viram registros iniciais da demonstração ou da aplicação. Capturas em `test-results` são saídas locais, não dados de participantes reais.

## Conferir na publicação Google

Em 17/10/2026, imagens do proprietário confirmaram a configuração inicial com 200 vagas, o Público sem login em janela InPrivate, o painel reconhecendo a conta administradora e o cadastro de quatro participantes no celular, com 196 vagas restantes. A atualização para PDF ainda requer aplicação e conferência no aparelho físico.

- [ ] Conta `porumajornadafeliz@gmail.com` cria a planilha privada e os dois projetos.
- [ ] Público abre sem login; painel exige conta Google autorizada.
- [ ] Após inicialização de uma instalação nova, zero inscrições e 200 vagas.
- [ ] Atualização de instalação existente preserva os registros e acrescenta `cancelledAt`; `SEAT_POLICY=REGISTERED`.
- [ ] Uma família de 4 pessoas passa de 200 a 196 vagas imediatamente, sem pagamento ou WhatsApp.
- [ ] Link, salvar em PDF e imprimir ficam disponíveis após registrar; o documento não afirma pagamento recebido.
- [ ] O PDF abre legível no leitor do celular, preserva nome, quantidade, valores, programação e link de consulta clicável.
- [ ] Repetir o envio, consultar ou acionar contato não desconta novamente.
- [ ] WhatsApp abre `(37) 3212-4980` com dados e valores corretos, sem token; o participante precisa enviar.
- [ ] Secretaria faz o controle financeiro fora do site. Não há botões para confirmar pagamento.
- [ ] Pix opcional mostra o favorecido, chave e valor corretos; se já pagou, não repetir.
- [ ] Em cópia de homologação, última vaga não pode ser ocupada duas vezes; grupo maior é recusado inteiro.
- [ ] Cancelamento libera lugares e mantém histórico; reativação respeita lotação.
- [ ] Entrada de inscrição ativa é permitida sem etapa financeira; cancelada/duplicada é recusada.
- [ ] Contas não autorizadas são recusadas; entrada não cancela inscrições nem recebe valores financeiros.
- [ ] CSV, impressão e telas funcionam nos celulares da equipe.

Os testes locais não publicam o sistema, não validam a identidade Google real e não substituem a conferência na conta da Igreja.
