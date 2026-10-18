# Validação

Execute `npm run build`, `npm test`, `npm run test:browser` e `npm run test:offline`. Node 22+, Chromium e pdftotext devem estar disponíveis. `npm ci` instala dependências fixadas no lockfile.

Os 49 testes de regras usam o código .gs em simulador das APIs Google. Cobrem cadastro e idempotência, preço das cinco categorias e cônjuge, nome/telefone, consulta limitada, última vaga e família inteira, cancelamento/reativação, bloqueio concorrente, prazo Brasília, assinatura/replay, permissões por conta e papel, migração sem perda de dados e publicação consolidada.

Os testes financeiros cobrem comprovantes privados, tipo/assinatura/tamanho, pasta privada, duplicação, recusa e reenvio, autorização de pagamento temporária sem acesso completo, expiração dessa autorização, secretaria autorizada, auditoria, confirmação tardia sem ultrapassar lotação, reserva expirada sem alterar linha, preservação de pagas, entrada somente após pagamento e cancelamento sem simular estorno.

No navegador, o fluxo usa cadastro, consulta com nome e WhatsApp sem link, QR decodificado por jsQR, ausência do bloco de guardar/copiar link, texto de aguardar conferência sem repetir pagamento, upload de comprovante sintético, download autorizado e conferência no painel, relatório CSV e entrada. WhatsApp é interceptado, sem enviar mensagens. PDFs são lidos por pdftotext para conferir texto, limites e tamanho de página; inclui nomes extensos/Unicode e todas as categorias. Telas de 320 a 1280 pixels são verificadas quanto a transbordamento e erros JavaScript.

A demonstração autônoma também é testada sem rede, com arquivos fictícios em memória. O Chromium deste ambiente bloqueia file://; o HTML é injetado em página vazia sem servidor. Não equivale a um teste físico de duplo clique no Windows.

## Conferência no Google após atualização

- Público continua sem login; Administração exige conta Google na lista permitida.
- A rotina de configuração preserva planilha e registros e cria pasta privada, sem compartilhar documentos.
- Inscrição pendente mostra Pix com valor e favorecido corretos. Não efetue pagamento apenas para testar a interface.
- Comprovante real de inscrição válida fica em conferência; secretaria consegue baixar, conferir o recebimento e registrar o resultado.
- Consulta por nome/WhatsApp permite retomar o pagamento sem colar link. Não expõe contato, token completo, categorias ou arquivo privado.
- Pago garante vagas e aparece no relatório. Abrir WhatsApp não confirma pagamento nem comprova entrega.
- Arquivo, PDF, consulta e botões funcionam nos celulares da equipe e participantes.
- Somente em cópia de homologação, simule o prazo: pendentes expiram; pagas permanecem; confirmação tardia respeita a lotação.

A versão anterior foi confirmada por imagens pelo proprietário. Esta atualização financeira precisa ser aplicada e conferida na conta da igreja. Testes locais não validam identidade Google, recebimento bancário, entrega de WhatsApp ou cotas reais.
