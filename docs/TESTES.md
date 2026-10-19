# Validação

Execute `npm run build`, `npm test`, `npm run test:browser` e `npm run test:offline`. Node 22+, Chromium e pdftotext devem estar disponíveis. `npm ci` instala dependências fixadas no lockfile.

Os testes de regras usam o código .gs em simulador das APIs Google. Cobrem cadastro e idempotência, preço das cinco categorias e cônjuge, nome/telefone, consulta limitada, última vaga e família inteira, cancelamento/reativação, bloqueio concorrente, prazo Brasília, assinatura/replay, permissões por conta e papel, migração sem perda de dados e publicação consolidada.

Quatro testes da manutenção verificam a limpeza única autorizada: identidade do proprietário, cópia validada antes de esvaziar, preservação de comprovantes/configurações, bloqueio de repetição e proteção em falhas. O arquivo de manutenção é separado e não entra nas implantações.

O parcelamento acrescenta testes de centavos exatos, calendários em Brasília, cobrança conjunta de vencidas, primeiro pagamento garantindo vagas, manutenção da garantia com saldo, quitação para entrada, conferência conjunta, não reaproveitar comprovante, migração de 21/22 colunas e retentativas de cadastros anteriores. Lembretes verificam consentimento, privacidade por papel e abertura sem alegar envio.

Os testes financeiros cobrem comprovantes privados, tipo/assinatura/tamanho, pasta privada, duplicação, recusa e reenvio, autorização de pagamento temporária sem acesso completo, expiração dessa autorização, secretaria autorizada, auditoria, confirmação tardia sem ultrapassar lotação, reserva expirada sem alterar linha, preservação de pagas, entrada somente após pagamento e cancelamento sem simular estorno.

Três fluxos de navegador cobrem cadastro integral e parcelado. O novo fluxo testa troca para 3x, depósito, vencidas juntas, comprovantes e conferência por conjunto, QR do saldo, CSV de parcelas e lembrete WhatsApp interceptado sem envio real. O fluxo original usa cadastro, consulta com nome e WhatsApp sem link, QR decodificado por jsQR, ausência do bloco de guardar/copiar link, texto de aguardar conferência sem repetir pagamento, upload de comprovante sintético, download autorizado e conferência no painel, relatório CSV e entrada. WhatsApp é interceptado, sem enviar mensagens. PDFs são lidos por pdftotext para conferir texto, limites e tamanho de página; inclui nomes extensos/Unicode e todas as categorias. Telas de 320 a 1280 pixels são verificadas quanto a transbordamento e erros JavaScript.

A demonstração autônoma também é testada sem rede, com arquivos fictícios em memória. O Chromium deste ambiente bloqueia file://; o HTML é injetado em página vazia sem servidor. Não equivale a um teste físico de duplo clique no Windows.

## Conferência no Google após atualização

- Público continua sem login; Administração exige conta Google na lista permitida.
- A rotina de configuração preserva planilha e registros e cria pasta privada, sem compartilhar documentos.
- Inscrição pendente mostra Pix com valor e favorecido corretos. Não efetue pagamento apenas para testar a interface.
- Comprovante real de inscrição válida fica em conferência; secretaria consegue baixar, conferir o recebimento e registrar o resultado.
- Consulta por nome/WhatsApp permite retomar o pagamento sem colar link. Não expõe contato, token completo, categorias ou arquivo privado.
- A primeira parcela confirmada garante vagas; quitação e saldo aparecem nos relatórios. Abrir WhatsApp não confirma pagamento nem comprova entrega.
- Arquivo, PDF, consulta e botões funcionam nos celulares da equipe e participantes.
- Somente em cópia de homologação, simule o prazo: pendentes expiram; pagas permanecem; confirmação tardia respeita a lotação.

A versão anterior foi confirmada por imagens pelo proprietário. Esta atualização financeira precisa ser aplicada e conferida na conta da igreja. Testes locais não validam identidade Google, recebimento bancário, entrega de WhatsApp ou cotas reais.

A revisão da escolha de pagamento verifica a etapa inicial sem QR/comprovante, as três condições e seus valores, à vista em 20/12, preservação da escolha após atualização, tela em 320/390/768 px e comprovante obrigatório. O lembrete à vista é preparado em 19/12 (Brasília). A migração prorroga somente à vista ainda não conferido, preservando os comprovantes e o histórico.

A limpeza final autorizada em 18/10 tem quatro verificações próprias: só o proprietário pode executar; a limpeza anterior não bloqueia esta nova autorização; dados e comprovantes são arquivados antes de esvaziar a base; repetir ou interromper não apaga novos cadastros. As duas rotinas de manutenção passaram em oito testes locais, sem acesso ao Google real.

A conclusão da Administração verifica no navegador a distinção entre reserva provisória e vaga garantida, a exigência de quitação para entrada, a conferência do comprovante por parcela ou conjunto, saldo e relatórios CSV. Inclui lembrete À vista em 19/12 para vencimento em 20/12. A publicação Google e os números atuais da igreja dependem da conferência no painel real após atualização.

A confirmação simples verifica download obrigatório antes de liberar o botão, confirmação em um clique sem formulário, parcelas e saldo, conta/data no histórico, proteção contra repetição e contra comprovante substituído. A recusa continua disponível em Outras ações. O fluxo real de interface do WhatsApp é exercitado com uma API local e todas as conversas interceptadas: arquivo inválido não abre conversa definitiva, envio válido abre resumo sem token privado, popup bloqueado oferece alternativa e consulta por nome/telefone acompanha a confirmação. Nenhuma mensagem real é enviada. As regras de garantia, vencimento e quitação continuam as mesmas.
