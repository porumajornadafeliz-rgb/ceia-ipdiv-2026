# Limpar os testes antes da divulgação

O proprietário confirmou que todas as inscrições e comprovantes atuais são testes, sem inscrições ou pagamentos reais. Esta rotina é para essa única limpeza, antes da divulgação. O sistema real só será limpo quando o proprietário executar a função no editor Google.

## O que a rotina faz

- Exige a conta proprietária porumajornadafeliz@gmail.com igual à conta efetiva.
- Usa o bloqueio do projeto Público e verifica a estrutura da planilha e o limite de 200.
- Copia e valida a aba Inscricoes inteira numa nova aba **Arquivo testes ...**, dentro da mesma planilha privada.
- Esvazia somente os dados da aba Inscricoes, preservando cabeçalhos e formatos.
- Mantém planilha, endereços, Pix, segredos, permissões e comprovantes privados. O arquivo de testes conserva as referências dos comprovantes; nada é enviado ao WhatsApp ou ao banco.
- Confere zero inscrições e 200 vagas e registra um marcador que impede executar a limpeza novamente sobre novos cadastros.

Se falhar ao copiar ou validar, a base original permanece intacta. Se a plataforma interromper a execução após registrar o marcador, não repita nem remova o marcador: confira o resultado e o arquivo de segurança antes de qualquer outra ação.

## Executar uma vez no Público

1. Extraia o ZIP. Abra LIMPAR_TESTES.gs no Bloco de Notas e copie todo o conteúdo.
2. Abra o editor **Ceia IPDiv 2026 — Público**, com a conta da igreja.
3. Ao lado de **Arquivos**, clique em **+ → Script**. Dê o nome **LIMPAR_TESTES**.
4. Substitua todo o conteúdo inicial desse novo arquivo pelo código copiado e salve. Não substitua o Código.gs principal nem o manifesto.
5. Selecione a função **limparTestesAntesDaDivulgacao** na lista ao lado de Executar.
6. Clique em **Executar**. O registro deve mostrar **LIMPEZA CONCLUÍDA. Inscrições ativas: 0. Vagas disponíveis: 200** e o nome da aba de segurança.
7. Envie uma imagem desse registro para conferência. Não implante esse arquivo temporário.
8. Depois de conferir o sucesso, remova somente LIMPAR_TESTES.gs do editor: menu de três pontos do arquivo → Excluir. O marcador de execução deve permanecer nas propriedades; não o remova.

Não é necessário criar uma nova implantação para limpar a planilha. Não execute prepararPublicacao para tentar limpar: ela preserva os registros.

## Conferir antes de divulgar

Feche as páginas antigas de testes e abra somente o endereço público terminado em /exec, sem o trecho #id=... dos testes. Use uma nova janela anônima para evitar retomar um teste da mesma aba. Confira **200 vagas restantes**. Links de inscrições de teste não devem ser divulgados.

Atualize também a Administração com os arquivos do pacote de Pix já baixado, caso ainda não tenha terminado. Preserve a execução como usuário com acesso e a identificação das contas autorizadas. No painel atualizado, confira lista vazia, zero famílias, zero participantes e valores zerados. Não crie outra inscrição de teste após a limpeza apenas para conferir o contador.

O link a divulgar à igreja é o endereço público /exec. O endereço da Administração fica com a equipe autorizada. O banco e o WhatsApp não são alterados pela limpeza.
