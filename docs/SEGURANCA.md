# Segurança e limites

O Público executa como proprietário e é o único projeto que acessa planilha e comprovantes privados. A Administração executa como o usuário que acessa e identifica a conta Google no servidor. As operações são assinadas HMAC-SHA256 com ação, parâmetros, identidade, horário e nonce; a lista `ADMIN_ACCOUNTS` é verificada em cada chamada. A janela é de 60 segundos; nonces das alterações ficam na auditoria para bloquear replay. Papéis: `admin`, `treasury`, `door`. Identidade enviada pelo navegador não concede privilégios.

`prepararPublicacao` só funciona com a conta ativa `porumajornadafeliz@gmail.com` igual ao proprietário efetivo. Reutiliza planilha, linhas, segredos e permissões existentes, criando a pasta privada de comprovantes se necessário. O Público pede escopos de planilhas, identificação e Drive. Administração pede identificação e requisições externas. Operadores não recebem acesso direto à pasta ou planilha.

## Reservas e confirmação

Cadastro, envio de comprovante, conferência financeira, garantia manual, cancelamento, reativação e entrada usam o mesmo ScriptLock. Toda a família é aceita ou recusada. Idempotência do cadastro e do comprovante evita duplicações. Após 20/12/2026, 23h59 Brasília, reservas não garantidas pela organização deixam de ocupar vagas automaticamente no cálculo; não é necessário gatilho nem apagar linhas. A caixa CONFIRMAR controla a garantia e pode ser marcada ou desmarcada sem comprovante. A alteração é auditada com conta, data e operação, sem registrar receita nem estorno. Uma versão da inscrição evita que uma tela desatualizada sobrescreva outra decisão. Marcar uma reserva expirada verifica vagas sob bloqueio. Pagamentos já registrados são preservados. Entrada exige inscrição ativa e pagamento confirmado, e bloqueia duplicação.

Os cabeçalhos financeiros existentes são reutilizados e uma coluna JSON paymentPlan é acrescentada após cancelledAt, sem alterar as 22 colunas anteriores. Ela guarda o calendário, cada comprovante, seu método e sua conferência. A inicialização de cabeçalho compatível só acrescenta `cancelledAt` quando ausente; não reordena ou apaga os registros. Status e datas financeiros históricos são preservados em um plano integral legado.

## Acesso de participantes

O acesso completo exige token de 256 bits, derivado por HMAC de identificador aleatório; só seu hash fica na planilha. O token fica no fragmento do endereço e só é transmitido à API da aplicação. `no-referrer`, recursos incorporados, ausência de analytics e mensagem WhatsApp sem token reduzem exposição. Não publique links individuais em grupos.

Nome completo e WhatsApp exatos permitem consultar situação, quantidade, data e entrada. Também emitem uma autorização de dez minutos exclusivamente para abrir dados de pagamento e enviar comprovante daquela inscrição. Essa autorização não recupera token nem permite ler contato, categorias, histórico, PDF completo ou comprovante privado. Nome e telefone não verificam posse do aparelho: alguém que conheça ambos pode consultar essa situação, valor e enviar comprovante; a secretaria precisa conferir o recebimento antes de aprovar. Não há confirmação financeira por autodeclaração.

Até vinte resultados recentes por contato e oito tentativas por telefone/minuto; CacheService oferece proteção de melhor esforço, não autenticação ou proteção distribuída. Não há CAPTCHA. Monitore spam e cotas.

## Comprovantes

Aceita apenas PDF, PNG e JPEG até 2 MB, com validação de base64, tamanho decodificado e assinatura inicial do formato. Isso não atesta autenticidade de um pagamento nem faz análise antimalware. A equipe deve conferir documentos e recebimento. A pasta precisa permanecer privada, sem editores ou leitores adicionais. Não há URL pública; download só pelo canal assinado a `admin`/`treasury`. `door` não recebe arquivos, valores ou auditoria financeira. Nomes dos arquivos são gerados pelo sistema.

Reenvio idêntico é idempotente enquanto o comprovante está em conferência. Outro arquivo só é aceito após recusa. Cada comprovante pode cobrir uma parcela ou um conjunto vencido. A aprovação confere a versão do arquivo e confirma o conjunto todo sob bloqueio. Reutilizar o mesmo comprovante em outro conjunto da mesma inscrição é recusado. O recebimento é somado só após conferência. Versões anteriores permanecem privadas para preservar auditoria. Defina com a igreja o prazo de retenção e a exclusão posterior; não há limpeza automática dos documentos nesta versão.

## Dados e serviços

Campos são renderizados com `textContent`, nomes iniciados por fórmulas são recusados, campos livres usam formato texto na planilha e CSV neutraliza fórmulas. Dinheiro usa centavos inteiros calculados no servidor, até cem participantes por cadastro. `sessionStorage` conserva somente a retomada na própria aba; a demonstração usa memória descartável.

Pix estático não tem webhook ou confirmação bancária. Somente conferência autorizada confirma pagamento; cancelamento não faz estorno. WhatsApp comum exige ação da pessoa para enviar a mensagem e anexar/compartilhar arquivo. O site não verifica entrega. Não há credenciais ou integração paga de API bancária, Meta ou WhatsApp no pacote. A fila de lembretes exige consentimento, é privada da secretaria, usa o dia seguinte em Brasília e não comprova entrega. O histórico registra somente abertura de conversa. Cancelamento dos lembretes é permitido pelo acesso de pagamento; ativar exige acesso completo ou consentimento no cadastro.

Apps Script, Planilhas e Drive possuem cotas: https://developers.google.com/apps-script/guides/services/quotas. Cada consulta lê a aba inteira, adequado ao porte comunitário previsto. O bloqueio espera até vinte segundos. Testes locais não comprovam configuração Google, privacidade efetiva ou disponibilidade da conta; a publicação exige conferência no ambiente da igreja.

O painel distingue uma recusa de identidade de falhas de comunicação. Somente leituras (identidade, lista e comprovante) têm uma segunda tentativa em falha transitória; alterações não são reenviadas automaticamente. Os registros ADMIN_PAGE_FAILURE e ADMIN_REQUEST_FAILURE contêm apenas a categoria do erro, sem segredos ou corpo de resposta. A garantia da vaga continua sendo validada e salva no servidor antes da mensagem de sucesso.
