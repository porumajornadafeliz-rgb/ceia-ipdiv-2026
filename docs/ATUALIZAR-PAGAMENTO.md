# Atualização: Pix, comprovantes e reservas

Este pacote atualiza os projetos existentes. Não crie outra planilha e não altere as chaves, propriedades, contas autorizadas ou endereços `/exec`. Os registros existentes são preservados. Guarde uma cópia do código atual antes da troca.

## 1. Projeto Público

1. Extraia o ZIP **ATUALIZAR-PIX-E-COMPROVANTES-IPDIV-2026.zip**.
2. Abra `PUBLICO/Code.gs` no Bloco de Notas e copie todo o conteúdo.
3. No projeto **Ceia IPDiv 2026 — Público**, clique em `Código.gs`, selecione todo o código e substitua pelo conteúdo copiado. Salve.
4. Abra `PUBLICO/appsscript.json` do pacote no Bloco de Notas. Copie tudo e substitua o conteúdo de `appsscript.json` no mesmo projeto Público. Salve. Se o manifesto não aparecer, engrenagem → marque **Mostrar o arquivo de manifesto appsscript.json no editor**.
5. No seletor de funções do editor, escolha **prepararPublicacao** e clique em **Executar**, usando a conta proprietária `porumajornadafeliz@gmail.com`.
6. Revise as permissões. Autorize o acesso ao Google Drive e às planilhas, e a identificação da conta. No aviso de app não verificado, confira que se trata do seu próprio projeto antes de avançar. Não deixe permissões desmarcadas. Esse acesso permite criar a pasta privada dos comprovantes.
7. Aguarde **Configuração concluída** no registro de execução. A rotina reutiliza a planilha existente, preserva as inscrições e cria uma única pasta privada de comprovantes. Não compartilhe essa pasta.
8. **Implantar → Gerenciar implantações → selecione a implantação pública → lápis → Versão: Nova versão → Implantar**. Preserve **Executar como: Eu** e acesso **Qualquer pessoa**. O endereço público existente continua sendo usado.

Não acrescente outra função de configuração nem duplique `Code.gs`. Mantenha somente um arquivo com o código consolidado, além do manifesto e de eventuais arquivos auxiliares que não repitam funções do pacote.

## 2. Projeto Administração

1. Abra `ADMINISTRACAO/Code.gs` no Bloco de Notas. Copie tudo e substitua o conteúdo de `Código.gs` do projeto **Ceia IPDiv 2026 — Administração**. Salve.
2. Substitua também `appsscript.json` pelo manifesto da pasta **ADMINISTRACAO**. Não use o manifesto do Público aqui.
3. **Implantar → Gerenciar implantações → implantação administrativa → lápis → Versão: Nova versão → Implantar**.
4. Preserve **Executar como: Usuário com acesso ao app da Web** e **Quem pode acessar: Qualquer pessoa com uma Conta do Google**. A lista de contas autorizadas continua sendo verificada pelo sistema.
5. Abra o endereço administrativo habitual e atualize os dados. Se houver nova autorização, marque **Conectar-se a um serviço externo** e identificação da conta.

## Conferência após atualizar

Use primeiro uma inscrição controlada que já exista. Não faça Pix de teste para conferir a interface.

- Consulte por nome e WhatsApp. A opção de colar link no rodapé foi removida.
- Uma reserva pendente permite abrir o Pix com QR Code, chave CNPJ e Copia e Cola com valor exato. Confira o favorecido no aplicativo bancário antes de pagar.
- O comprovante aceita PDF, JPG ou PNG de até 2 MB e fica privado no sistema.
- Enviar o comprovante mostra **Comprovante em conferência**, sem marcar como pago.
- No painel, **BAIXAR COMPROVANTE** permite conferir. Depois use **CONFERIR PAGAMENTO**, registre o resultado e o motivo. Somente confirme recebimentos efetivamente verificados.
- A confirmação mostra **Pago — comprovante conferido** e **Vaga garantida**. Os relatórios incluem situação, valor e datas da conferência. Entrada exige pagamento confirmado.
- O WhatsApp abre com o resumo. A pessoa precisa tocar em **Enviar**. No celular, se o navegador permitir, pode compartilhar o arquivo enviado pelo botão de compartilhamento; a conversa e o destinatário são escolhidos pela pessoa.

## Regras acordadas

Cadastrar reserva os lugares imediatamente. Reservas ainda sem pagamento confirmado ocupam vagas até **20/12/2026, às 23h59 (Brasília)**. A partir de **21/12/2026, 00h00**, deixam de ocupar vagas automaticamente nos cálculos; os registros e históricos permanecem. Isso também vale para comprovantes ainda em conferência: só a confirmação garante os lugares. Nenhuma reserva é retirada antes desse prazo para atender outra pessoa.

Pagamentos confirmados mantêm as vagas. Uma confirmação feita depois do prazo precisa ter lugares disponíveis para toda a família, verificados sob bloqueio. O sistema não realiza devoluções bancárias.

Pix estático não informa automaticamente se o banco recebeu. A secretaria confere o comprovante e o recebimento no painel. O aplicativo WhatsApp comum também não permite envio silencioso: a mensagem é preparada e a pessoa envia. Automação de entrega exige uma integração oficial, que a igreja ainda não possui.
