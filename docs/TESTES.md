# Testes e validação

## Verificado no ambiente local

Comandos executados durante a entrega:

```sh
npm run build
npm test
npm run test:browser
```

`npm test` executa **20 testes** com o código `.gs` real dentro de um simulador das APIs Google. Exercita o canal administrativo completo, incluindo assinatura e identidade simuladas; não usa uma versão alternativa das regras do negócio.

| Área | Cobertura local |
|---|---|
| Categorias | Valores unitários, filhos não membros, soma e rejeição de quantidades inválidas |
| Cônjuge | Limite de um e necessidade de adulto membro |
| Prazo | Último milissegundo do dia permitido, bloqueio no instante seguinte e consulta posterior |
| Duplicações | Mesmo identificador retorna mesma inscrição/token; payload alterado é recusado |
| Pix | TLV, chave, valor, moeda, TxId e CRC com vetor conhecido e cálculo independente |
| QR Code | Decodificado por `jsQR`, uma implementação independente do gerador |
| Aviso de Pix | Não marca como pago, mesmo com parâmetros extras adulterados |
| Tesouraria | Conferência manual, referência obrigatória, auditoria e estorno antes da entrada |
| Entrada | Check-in familiar, bloqueio de duplicação, pendência e exceção exclusiva de admin |
| Configuração da Igreja | Conta inicial porumajornadafeliz@gmail.com autorizada como admin e listas existentes preservadas |
| Autorização | Conta vazia/desconhecida negada; identidade e papel do navegador ignorados |
| Canal assinado | Assinatura inválida/alterada, requisição expirada e replay de mutação |
| Dados | Sem tokens internos na listagem, sem finanças para conferencista e sem fórmulas em nomes |
| Falhas | Contenção do lock não grava inscrição parcial |
| Indicadores | Famílias, pessoas, valores e entradas coerentes |
| Comprovante opcional | Token, formato, pasta privada, um arquivo por inscrição e download restrito |

O teste de navegador usa Chromium em modo headless, executa as páginas e APIs locais e gera capturas em `test-results/` (não versionadas). Confere o carregamento local do logotipo oficial nas páginas pública e administrativa, visualização sem transbordamento entre 320 e 1280 pixels, botões +/−, regra do cônjuge, resumo, geração e decodificação do QR renderizado, aviso sem confirmação, upload/download opcional, pagamento manual, consulta pelo link privado, recibo, pesquisa por nome/telefone/número, filtros, check-in e CSV. Verifica ausência de erros JavaScript e de envio a serviços externos nesse fluxo.

São testes funcionais locais; **não são um teste de carga, uma auditoria de segurança independente, uma implantação Google ou uma validação bancária**.

## Demonstração autônoma para análise

`npm run build` também gera `entrega/ABRIR-DEMONSTRACAO.html`. O comando `npm run test:offline` verifica esse HTML completo em Chromium com toda a rede desativada, incluindo logotipo, prazo destacado, programação do culto e da ceia, categoria de cônjuge corrigida, cadastro, valores, QR sem Pix válido, aviso pendente, confirmação simulada na tesouraria, retorno à consulta, programação no recibo salvo, check-in, bloqueio de duplicação, bloqueio de não pago, responsividade e descarte dos dados ao recarregar.

A política do navegador no ambiente de execução bloqueia a navegação direta a URLs `file://`; por isso o teste injeta o mesmo HTML completo em uma página vazia, sem servidor ou requisições de rede. O teste não executa o Windows nem o gesto de duplo clique do usuário. O arquivo entregue é HTML autônomo para abrir no Edge ou Chrome, sem instalação.

A demonstração usa os mesmos formulários e as mesmas funções de cálculo e transição de pagamento/entrada do projeto. O armazenamento e os papéis são simulados no navegador para permitir análise sem Google. Ela não valida autenticação Google, assinatura entre projetos, prazo real de inscrição, gravação em Planilhas ou cotas de produção. O simulador é separado e não é incluído nos arquivos Apps Script publicados.

## Lista obrigatória antes de abrir inscrições reais

Faça estes testes nas versões `/exec`, com uma inscrição e um pagamento de teste autorizados pela Igreja. Use dados identificados como teste e mantenha a rastreabilidade contábil.

- [ ] Logotipo original incorporado; nomes, local, endereço, data e prazo conferidos.
- [ ] Link público abre em aba anônima, sem pedir login Google.
- [ ] Cada categoria cobra respectivamente R$ 80, R$ 40, R$ 80, R$ 120 e R$ 60.
- [ ] Família com 1 adulto membro, 1 criança membro, 1 cônjuge, 1 adulto não membro e 1 criança não membro soma 5 pessoas e **R$ 380,00**.
- [ ] Cônjuge não pode ser adicionado sem adulto membro nem ultrapassar uma unidade.
- [ ] Filhos não membros são contados nas categorias de não membro; a orientação de idade usa 31/12/2026.
- [ ] Clique repetido/retentativa do mesmo envio não cria outra linha.
- [ ] Na homologação, confira a lógica de prazo já testada localmente. Não altere a data em produção para simular o fechamento; use uma cópia privada separada se precisar de teste temporal no Google.
- [ ] QR e Copia e Cola são lidos pelo banco com a chave, favorecido e valor corretos.
- [ ] Tesouraria verificou a titularidade da chave no banco e um pagamento autorizado realmente creditou a conta.
- [ ] “Já fiz o Pix” e upload opcional deixam o pagamento pendente.
- [ ] Comprovante fica privado; só tesouraria/admin conseguem baixá-lo; conferencista é recusado.
- [ ] Conta de tesouraria entra com Google, confirma pelo extrato e gera histórico com a conta correta.
- [ ] Link individual passa a mostrar PAGAMENTO CONFIRMADO e permite salvar/compartilhar/imprimir a confirmação.
- [ ] Token ausente, adulterado e de outra inscrição são recusados.
- [ ] Conta fora de `ADMIN_ACCOUNTS` é recusada na página **e** nas operações administrativas.
- [ ] Conta de entrada não consegue confirmar pagamento, mesmo tentando chamar a operação diretamente no navegador.
- [ ] Pesquisa encontra o responsável por nome, telefone com/sem pontuação e número da inscrição.
- [ ] Um clique confirma a entrada familiar; outro celular/segunda tentativa não pode duplicá-la.
- [ ] Conferencista não libera pendente; admin só libera com justificativa e o pagamento continua pendente.
- [ ] CSV financeiro, filtros de entrada e impressão de contingência foram conferidos.
- [ ] As contas operacionais não têm edição nos projetos ou na planilha.
- [ ] Painéis funcionam nos celulares da equipe, com as contas Google corretas e os consentimentos necessários.

Somente após concluir a lista, compartilhe o link público da Igreja pelo WhatsApp. A pasta `dist` contém arquivos para publicação; sua geração não significa que o sistema esteja disponível na internet.
