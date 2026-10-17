ATUALIZAÇÃO — INSCRIÇÃO LEGÍVEL NO CELULAR

A atualização troca o arquivo de texto por um PDF com logo, letras maiores,
dados e valores, programação e botão com o link individual de consulta.
Na mesma aba, Consultar minha inscrição abre o cadastro já conhecido.

ATUALIZAR APENAS O PROJETO PÚBLICO EXISTENTE

1. Extraia ATUALIZAR-PDF-IPDIV-2026.zip em uma nova pasta.
2. Abra PUBLICO/Code.gs com o Bloco de Notas. Selecione tudo (Ctrl+A)
   e copie (Ctrl+C).
3. No Google Apps Script, abra o projeto já existente:
   Ceia IPDiv 2026 — Público.
4. Clique no editor (<>) e depois em Código.gs. Selecione todo o conteúdo
   desse arquivo e substitua pelo conteúdo copiado. Salve e aguarde.
5. O novo Código.gs já inclui prepararPublicacao. Se você criou o arquivo
   extra CONFIGURAR.gs durante a instalação, e ele contém apenas aquela
   função prepararPublicacao, exclua somente esse arquivo extra para não
   manter duas definições da mesma função. Preserve os demais arquivos.
6. Não execute prepararPublicacao nem altere as propriedades do script.
   A atualização não precisa mudar a planilha, as chaves, os manifestos
   nem o projeto Administração.
7. Clique em Implantar > Gerenciar implantações. Selecione a implantação
   pública existente e clique no lápis (Editar).
8. No campo Versão, selecione Nova versão. Clique em Implantar.
   Não use Nova implantação: estamos preservando o link público atual.
9. Abra novamente o link individual que você já guardou, atualize a página
   e use SALVAR INSCRIÇÃO EM PDF. Não registre outra família para testar.
   O documento baixado deve terminar em .pdf. O arquivo .txt antigo que
   já está no telefone continua antigo; baixe o novo PDF para substituí-lo.

CONSULTA DA INSCRIÇÃO

Ao registrar, guarde o endereço do botão COPIAR MEU LINK. Ele contém o
número da inscrição e um token particular. O PDF terá um botão clicável
Consultar minha inscrição. O texto compartilhado também inclui esse link.
Se voltar ao início da mesma aba, Consultar minha inscrição já abre o
cadastro conhecido. Em outro aparelho, use o link individual completo.
Abrir o site público geral não identifica uma pessoa pelo nome/telefone.

O aviso azul no topo pertence ao Google Apps Script. Pode ser fechado no X,
mas não há opção no projeto para desativá-lo permanentemente.

VALIDADO LOCALMENTE

34 testes do servidor; fluxos de navegador e demonstração offline; PDF real
verificado por leitor independente, inclusive acentos, nomes longos,
caracteres fora de Latin-1, todas as categorias e limites das páginas.
Os testes não criam inscrições na planilha da igreja. A publicação na sua
conta e a abertura no leitor físico do Android devem ser conferidas após
atualizar a implantação existente.
