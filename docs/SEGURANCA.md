# Segurança, arquitetura e limites

## Acesso

O projeto público executa como proprietário e é o único que acessa a planilha privada. O projeto administrativo executa como o usuário que acessa, obtém o e-mail da conta Google no servidor e encaminha operações assinadas por HMAC-SHA256 ao público.

A lista `ADMIN_ACCOUNTS` é verificada em cada chamada. Papéis: `admin`, `treasury` (Secretaria) e `door`. Uma identidade enviada pelo navegador não concede privilégios. O painel não requer compartilhar o editor ou a planilha com os operadores.

A assinatura cobre ação, identidade, parâmetros, horário e nonce, com janela de 60 segundos. O nonce fica no histórico para impedir repetição de alterações após uma operação posterior. A comparação da assinatura é de tempo constante para conteúdos de mesmo comprimento.

A função visível `prepararPublicacao` existe para execução no editor. Ela exige a conta ativa `porumajornadafeliz@gmail.com` igual à identidade efetiva do proprietário. Visitantes anônimos, outras contas e execução sob outro proprietário são recusados antes de criar planilha ou alterar propriedades. O manifesto público inclui identificação de e-mail para essa verificação; a rotina interna continua privada.

## Vagas e registros

A capacidade é de 200 pessoas. Toda inscrição ativa ocupa lugares, sem depender de pagamento, cópia de link, envio de WhatsApp ou entrada. `SEAT_POLICY=REGISTERED` é gravado na inicialização; uma configuração antiga `PAID` não reativa o fluxo financeiro.

Cadastro, cancelamento, reativação e entrada são executados sob o **mesmo ScriptLock** do projeto público. O cadastro valida disponibilidade para toda a família antes de gravar. A reativação também valida a lotação. O identificador de envio e o hash dos dados garantem idempotência de retentativas, inclusive depois do prazo ou do esgotamento.

O contador público retorna somente agregados. A atualização periódica não constitui uma reserva no navegador: o servidor sempre confere novamente ao gravar. Inscrição cancelada não ocupa lugares nem autoriza entrada. Entrada registrada impede cancelamento e duplicação de entrada.

A planilha inicia sem inscrições. A atualização de uma planilha existente acrescenta a coluna `cancelledAt` ao cabeçalho compatível, preservando as demais colunas, registros e históricos. Os campos financeiros e referências privadas de versões anteriores são preservados para evitar perda de dados, mas não há operações financeiras ou de comprovantes nesta versão. Uma estrutura de cabeçalho diferente é recusada.

## Privacidade

O ID é aleatório e o acesso público exige um token de 256 bits derivado por HMAC de um identificador aleatório. A planilha guarda apenas o hash do token. Não existe pesquisa pública por nome ou telefone. O link individual dá acesso aos dados daquela inscrição; compartilhe apenas com pessoas de confiança.

O token fica no fragmento `#` do link. A consulta o transmite somente à API da própria aplicação. A página declara `no-referrer` e não usa analytics, CDN, fontes ou QR remotos. A mensagem WhatsApp contém os dados necessários para a secretaria, sem o token privado.

`sessionStorage` guarda temporariamente o envio em andamento e o acesso da inscrição na própria aba. Não há `localStorage` ou rastreamento. A demonstração autônoma substitui esse armazenamento por memória descartada ao fechar/recarregar.

Dados são renderizados por `textContent`. Nomes que poderiam iniciar fórmulas são rejeitados, campos livres da planilha têm formato de texto e CSVs neutralizam fórmulas. Valores monetários são inteiros em centavos, recalculados no servidor; quantidades são inteiras e limitadas a 100 pessoas por inscrição.

## Pagamento e WhatsApp

O controle financeiro é feito pela secretaria fora do sistema. O Pix é estático, com chave CNPJ, valor exato e TxId da inscrição; o QR é gerado localmente. Não há leitura bancária, webhook, confirmação automática, upload de comprovante, crédito/devolução ou exigência de pagamento na entrada.

A aplicação nunca apresenta um registro de inscrição como comprovante de pagamento. Valores no painel são declarados pelas inscrições, não saldo recebido. Campos financeiros históricos não são usados como condição de inscrição ou entrada.

Abrir o WhatsApp prepara uma mensagem. O participante confere e toca em Enviar. O horário de contato registrado indica apenas o acionamento do botão, sem garantir envio ou entrega. O sistema não usa uma API de envio de WhatsApp.

## Disponibilidade

Apps Script e Planilhas possuem cotas de execução, simultaneidade e armazenamento: https://developers.google.com/apps-script/guides/services/quotas. As consultas leem a aba inteira, adequadas ao porte comunitário previsto; os testes locais não são testes de carga ou uma garantia de disponibilidade.

O endpoint anônimo pode sofrer spam ou consumo excessivo de cotas. Esta versão não possui CAPTCHA ou proteção distribuída. Monitore a divulgação e as execuções. O bloqueio espera até 20 segundos antes de retornar uma falha recuperável; não exponha detalhes internos de serviços ou permissões.

A publicação real deve validar identidade Google, contas autorizadas, privacidade da planilha, fluxo no celular e integridade do Pix. O simulador local não comprova configuração ou acesso à conta Google. Nenhuma senha ou segredo da Igreja é incluído no pacote.
