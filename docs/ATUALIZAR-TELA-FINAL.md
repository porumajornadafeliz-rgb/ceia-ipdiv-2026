# Correção da tela final da inscrição

Esta correção é para o Público que já recebeu a atualização de Pix e comprovantes e foi autorizado a acessar o Drive. Retira o bloco “Guarde seu link de inscrição”, o campo de endereço e os botões de copiar/compartilhar link. Mantém o PDF, a consulta por nome e WhatsApp e o acesso particular dos PDFs existentes.

Após receber o comprovante, a tela passa a orientar aguardar a conferência e não repetir o Pix. O botão de voltar deixa de dizer “pagar depois” nessa situação. Enviar arquivo não confirma pagamento.

## Aplicar somente ao Público

1. Extraia este ZIP. Abra `PUBLICO/Code.gs` no Bloco de Notas e copie todo o conteúdo.
2. Na aba **Ceia IPDiv 2026 — Público**, abra **Código.gs** no editor. Substitua todo o conteúdo pelo código copiado e salve.
3. O manifesto, as propriedades e a autorização do Drive continuam os mesmos da atualização de Pix já concluída. Não é necessário executar prepararPublicacao novamente para esta correção.
4. **Implantar → Gerenciar implantações → implantação pública existente → lápis → Versão: Nova versão → Implantar**.
5. Preserve **Executar como: Eu** e acesso **Qualquer pessoa**. O endereço existente continua válido.
6. Reabra uma inscrição existente e confira: sem o bloco de link, com botão para salvar PDF. Não cadastre outra inscrição somente para conferir a tela.

A Administração continua usando os arquivos do pacote de Pix já baixado. Se ainda não atualizou esse projeto, conclua os passos do guia daquele pacote: Código.gs, manifesto e nova versão da implantação administrativa.

## Onde ficam os comprovantes

O envio pelo site salva o arquivo no Google Drive da conta proprietária, dentro da pasta privada **Ceia IPDiv 2026 — Comprovantes privados**. A planilha guarda a referência vinculada à inscrição. A pasta não é a pasta ADMINISTRACAO do ZIP extraído no computador.

Após atualizar a Administração, a secretaria pode usar **BAIXAR COMPROVANTE** e depois **CONFERIR PAGAMENTO** no painel. O compartilhamento pelo WhatsApp é uma ação separada feita pela pessoa. O envio pelo site não envia o arquivo automaticamente pelo WhatsApp.
