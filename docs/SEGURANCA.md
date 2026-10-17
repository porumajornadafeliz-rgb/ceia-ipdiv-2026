# Segurança, arquitetura e limites

## Fronteiras de confiança

```text
Participante (sem login)
  → Projeto público (executa como proprietário)
      → Planilha privada / pasta privada de comprovantes

Equipe (conta Google)
  → Projeto administrativo (executa como o usuário que acessa)
      → Identidade fornecida por Session.getActiveUser(), no servidor
      → Requisição assinada HMAC-SHA256 ao projeto público
          → Conferência da assinatura, prazo, conta e papel
          → Mesma planilha / mesmo bloqueio de escrita
```

A implantação administrativa exige login Google; a identidade não é recebida de campos do HTML ou parâmetros de URL. E-mails vazios ou não permitidos falham de forma fechada. A lista de autorização fica em `ADMIN_ACCOUNTS` do projeto público e é relida em cada chamada. Não é suficiente esconder botões: todas as permissões também são aplicadas no servidor.

A comunicação entre projetos é necessária para que o conferencista não receba acesso de edição da planilha, o que permitiria contornar as regras do painel. O administrativo não possui escopo de Planilhas ou Drive. Apenas o projeto público acessa esses dados, executando como proprietário. A tesouraria também não precisa de acesso direto à planilha.

A assinatura cobre o texto integral da requisição, incluindo identidade, ação, parâmetros, horário e nonce. A janela de aceitação é de 60 segundos; a comparação da assinatura percorre todo o conteúdo de mesmo comprimento. Mutações guardam o nonce no histórico da própria linha para não reaplicar uma operação recebida novamente. Todas as operações de escrita usam o `ScriptLock` do **mesmo projeto público**. Não se tenta coordenar duas planilhas com bloqueios de projetos diferentes.

Não compartilhe o editor ou as propriedades dos projetos com operadores. Um editor técnico autorizado pode alterar código, papéis e segredos e tem, portanto, privilégios de administrador técnico. A auditoria é operacional, não um livro imutável contra o proprietário da conta. Faça backups privados da planilha para a contabilidade sem editar o original em produção.

## Dados de participantes

- Apenas nome, WhatsApp, quantidades, situação e metadados necessários. Não exige CPF, e-mail, aniversário ou nomes de familiares.
- O identificador de inscrição é aleatório, com verificação de colisão sob lock. O acesso público exige também token de 256 bits derivado por HMAC-SHA256 de um UUID aleatório. A planilha armazena apenas o hash SHA-256 do token, não o token de consulta em claro.
- O token está no fragmento `#` do link, não em parâmetros enviados na requisição inicial. O Apps Script o lê pela API de localização e o envia para a operação de consulta. O HTML declara `no-referrer` e não usa scripts de CDN, fontes externas, analytics ou serviço remoto de QR Code.
- Qualquer pessoa com o link individual pode consultar o nome e os dados daquela inscrição. O compartilhamento deve ser restrito ao responsável/pessoas de confiança. O link não é uma autenticação da identidade civil do portador.
- O navegador guarda temporariamente um envio em andamento na `sessionStorage` da aba para retentativa; remove após sucesso. Não utiliza `localStorage` nem rastreadores. Uma aba compartilhada pode manter dados até ser fechada; evite preencher em dispositivo público.
- Dados de inscrição são renderizados via `textContent`, não como HTML. Entradas livres que poderiam iniciar fórmulas são rejeitadas; campos de texto da planilha recebem formato literal. CSVs também neutralizam fórmulas.

## Comprovantes

O arquivo é opcional e limitado a 1 MiB. A extensão informada pelo usuário não decide o tipo: o servidor verifica os bytes iniciais de PDF, PNG ou JPEG. Os nomes no Drive são gerados a partir da inscrição, sem reutilizar nomes recebidos. A pasta precisa ter acesso geral privado e não pode ter editores ou visualizadores adicionais.

O servidor só aceita um comprovante por inscrição. Repetir o envio retorna o já recebido. Não há substituição ou exclusão pelo participante, para preservar o primeiro arquivo e evitar perda involuntária. A tesouraria é avisada quando houver arquivo e pode baixá-lo por uma ação autenticada. O ID do arquivo não é enviado ao participante ou ao conferencista; não se cria um link público do Drive.

A validação do formato não é antivírus. Não execute conteúdo de arquivos enviados por terceiros. Esta versão não inclui análise automatizada de documentos. O conteúdo é evidência auxiliar; somente o extrato bancário permite confirmar o recebimento.

## Pagamentos e entrada

Preços são inteiros em centavos e quantidades inteiras, sem confiar no total enviado pelo navegador. São permitidas de 1 a 100 pessoas por inscrição; o limite evita abuso e pode ser revisto em tarefa de código se a organização precisar de grupos maiores. O prazo é `2026-12-21T03:00:00Z`, limite exclusivo equivalente a 00h00 de 21/12 em Brasília.

O Pix usa chave CNPJ `20896270000130`, moeda BRL `986`, valor exato, identificador alfanumérico e CRC16/CCITT-FALSE. Ele é estático e não consulta o Itaú. Não há webhook, leitura bancária, confirmação automática ou cobrança recorrente.

Avisar ou anexar comprovante **não altera `PENDING` para `PAID`**. Confirmar/desfazer pagamento exige tesouraria/admin e referência/motivo, registrando usuário e horário. Depois de uma entrada, não é possível desfazer pagamento pelo painel. Uma exceção de entrada exige administrador e justificativa e mantém o débito pendente. Estado e histórico são gravados juntos na mesma linha, com lock, antes de responder ao cliente.

## Disponibilidade e cotas gratuitas

É uma solução para um evento comunitário, sem garantia de disponibilidade ou processamento bancário. Google Apps Script, Planilhas e Drive possuem limites de armazenamento, execução, simultaneidade e requisições, que variam por tipo de conta e podem mudar. Veja a fonte oficial: https://developers.google.com/apps-script/guides/services/quotas

Cada listagem lê a aba inteira; adequado para um evento de porte comunitário, sem alegação de teste de carga ou escala ilimitada. Não há atualização contínua automática no painel, para reduzir consumo. O lock espera até 20 segundos antes de retornar uma mensagem recuperável. Erros usuais de serviços/permissões/cotas são apresentados sem detalhes internos.

O endpoint público está sujeito a spam e esgotamento das cotas pelo acesso anônimo. As validações e limites por envio não equivalem a proteção contra ataques distribuídos. Nesta versão não há CAPTCHA, cobrança ou serviço externo antiabuso. Monitore execuções e cotas durante a divulgação. Se o volume exceder o previsto, suspenda a divulgação e reavalie a solução com a organização; não desabilite as regras ou publique dados para contornar limites.

A Igreja define quem pode tratar os dados, como atender correções, a retenção e a eliminação de relatórios, inscrições e comprovantes. O repositório não substitui as decisões administrativas sobre proteção de dados e contabilidade. Não guarde senhas ou chaves em commits, capturas de tela, logs ou instruções de instalação.

## O que exige validação na implantação real

O simulador local substitui serviços Google e não atesta que a conta da Igreja consegue publicar, executar, fornecer identidade ou acessar os recursos. Antes de uso real, valide os dois `/exec`, o login de cada papel, a negação a uma conta não autorizada, os dados privados e o pagamento bancário autorizado. Políticas do domínio ou consentimento OAuth podem exigir configuração adicional da conta. Nenhum desses passos foi executado automaticamente na conta Google.
