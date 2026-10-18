import assert from 'node:assert/strict';
import {chromium} from '@playwright/test';
import {readFile,mkdir} from 'node:fs/promises';
import {PNG} from 'pngjs';import jsQR from 'jsqr';
import {preview} from '../scripts/preview.mjs';
import {registration} from './platform.mjs';
import {checkReceiptPdf} from './pdf-check.mjs';
const {server,app}=preview(0);await new Promise(r=>server.on('listening',r));const base='http://127.0.0.1:'+server.address().port;let browser;
const receipt=n=>({name:'teste-'+n+'.pdf',mimeType:'application/pdf',buffer:Buffer.from('%PDF-1.4\nSynthetic installment receipt '+n+'\n%%EOF')});
try{
 app.setTime('2026-11-21T15:00:00Z');browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox']});
 const context=await browser.newContext({viewport:{width:390,height:844}});context.setDefaultTimeout(15000);const errors=[],requests=[];
 context.on('page',p=>p.on('pageerror',e=>errors.push(e.message)));context.on('request',r=>requests.push(r.url()));
 await context.route('https://wa.me/**',r=>r.fulfill({status:200,contentType:'text/html',body:'WhatsApp interceptado no teste; nada enviado.'}));
 const page=await context.newPage();await page.goto(base);await page.getByRole('button',{name:'FAZER MINHA INSCRIÇÃO',exact:true}).click();
 await page.getByLabel('Nome do responsável',{exact:true}).fill('Família Parcelamento');await page.getByLabel('WhatsApp com DDD',{exact:true}).fill('37999991234');
 for(let i=0;i<3;i++)await page.locator('#plus-adultMembers').click();await page.locator('#reminder-consent').check();
 await page.getByRole('button',{name:'CONFERIR INSCRIÇÃO',exact:true}).click();await page.getByRole('button',{name:'CONFIRMAR E ESCOLHER PAGAMENTO',exact:true}).click();await page.getByText('Escolha como deseja pagar',{exact:true}).waitFor();
 assert.equal(await page.locator('#pix-section').count(),0);assert.equal(await page.locator('#payment-receipt').isVisible(),false);assert.equal(await page.locator('#choose-payment-plan').isDisabled(),true);
 assert.deepEqual(await page.locator('#payment-plan option:not(:disabled)').allTextContents(),['À vista','2x','3x']);
 for(const [plan,amount,date] of [['ONCE','320,00','20/12/2026'],['TWICE','160,00','20/11/2026'],['THRICE','106,67','25/10/2026']]){
  await page.locator('#payment-plan').selectOption(plan);assert.match(await page.locator('.payment-plan-preview').innerText(),new RegExp(amount));assert.ok((await page.locator('.payment-plan-preview').innerText()).includes(date));assert.equal(await page.locator('#proof-file').count(),0);
 }
 for(const width of [320,390,768]){await page.setViewportSize({width,height:844});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));}
 await mkdir('test-results',{recursive:true});await page.setViewportSize({width:390,height:844});await page.screenshot({path:'test-results/escolha-pagamento-mobile.png',fullPage:true});
 await page.locator('#choose-payment-plan').click();await page.waitForFunction(()=>document.querySelectorAll('#payment-controls .installment-row').length===3);
 await page.getByText('Ver parcelas e vencimentos',{exact:true}).click();assert.match(await page.locator('#payment-controls').innerText(),/106,67/);assert.match(await page.locator('#payment-controls').innerText(),/106,66/);await page.getByText('Ver parcelas e vencimentos',{exact:true}).click();assert.match(await page.locator('#payment-group').inputValue(),/^0$/);
 assert.match(await page.locator('#payment-controls .payment-amount').innerText(),/213,34/);
 await page.locator('#refresh-payment').click();assert.equal(await page.locator('#payment-plan').count(),0,'Atualizar preserva a condição escolhida');
 await page.getByRole('button',{name:'ALTERAR CONDIÇÃO DE PAGAMENTO',exact:true}).click();await page.locator('#payment-plan').selectOption('ONCE');await page.locator('#choose-payment-plan').click();await page.locator('#payment-method').waitFor();
 assert.match(await page.locator('#payment-controls .payment-amount').innerText(),/320,00/);assert.match(await page.locator('#payment-controls').innerText(),/Vencimento: 20\/12\/2026/);
 await page.getByRole('button',{name:'ALTERAR CONDIÇÃO DE PAGAMENTO',exact:true}).click();await page.locator('#payment-plan').selectOption('THRICE');await page.locator('#choose-payment-plan').click();await page.locator('#payment-method').waitFor();
 await page.locator('#proof-button').click();await page.locator('#payment-controls').getByText('Selecione um comprovante em PDF, JPG ou PNG de até 2 MB.',{exact:true}).waitFor();

 await page.locator('#payment-method').selectOption('DEPOSIT');assert.equal(await page.locator('#pix-section').isVisible(),false);assert.match(await page.locator('.bank-details').innerText(),/16\.405-8/);
 for(const width of [320,390,768]){await page.setViewportSize({width,height:844});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'Pagamento não transborda em '+width);}
 await mkdir('test-results',{recursive:true});await page.setViewportSize({width:390,height:844});await page.screenshot({path:'test-results/parcelamento-mobile.png',fullPage:true});
 const id=await page.locator('#registration-id').innerText();await page.locator('#proof-file').setInputFiles(receipt(1));await page.locator('#proof-button').click();await page.locator('#financial-status').getByText('COMPROVANTE EM CONFERÊNCIA',{exact:true}).waitFor();assert.equal(await page.getByRole('button',{name:'ALTERAR CONDIÇÃO DE PAGAMENTO',exact:true}).count(),0);
 const admin=await context.newPage();await admin.goto(base+'/admin');
 async function confirm(number){const suffix=number===1?'1 e 2':'3';const download=admin.waitForEvent('download');await admin.getByRole('button',{name:'BAIXAR COMPROVANTE · '+suffix,exact:true}).click();assert.match(await readFile(await(await download).path(),'utf8'),/Synthetic installment receipt/);await admin.getByRole('button',{name:'CONFERIR PAGAMENTO · '+suffix,exact:true}).click();await admin.getByLabel('Motivo obrigatório').fill('Valor e recebimento conferidos no teste');await admin.locator('#submit-action').click();await admin.locator('#action-dialog').waitFor({state:'hidden'});}
 await confirm(1);await admin.locator('#table-body').getByText('PAGAMENTO PARCIAL',{exact:true}).waitFor();assert.equal(app.adminApi('list').data.metrics.receivedTotal,21334);
 await page.locator('#refresh-payment').click();await page.locator('#payment-status').getByText('VAGA GARANTIDA',{exact:true}).waitFor();assert.match(await page.locator('#payment-controls .payment-amount').innerText(),/106,66/);
 const pdfDownload=page.waitForEvent('download');await page.locator('#save-receipt').click();await checkReceiptPdf(await pdfDownload,[/Recebido: R\$\s213,34/,/Saldo: R\$\s106,66/,/20\/12\/2026/,/Valor da inscrição: R\$\s320,00/]);
 const qr=PNG.sync.read(await page.locator('#qr').screenshot());const decoded=jsQR(new Uint8ClampedArray(qr.data),qr.width,qr.height)?.data;assert.equal(decoded,await page.locator('#pix-code').inputValue());assert.match(decoded,/5406106\.66/);
 await page.locator('#proof-file').setInputFiles(receipt(2));await page.locator('#proof-button').click();await page.locator('#financial-status').getByText('COMPROVANTE EM CONFERÊNCIA',{exact:true}).waitFor();await admin.locator('#reload').click();await confirm(3);await admin.locator('#table-body').getByText('PAGO — COMPROVANTE CONFERIDO',{exact:true}).first().waitFor();
 const csvPromise=admin.waitForEvent('download');await admin.locator('#export-parts').click();const csv=await readFile(await(await csvPromise).path(),'utf8');assert.equal(csv.split('\r\n').length,4);assert.match(csv,/Depósito/);assert.match(csv,/Pix/);assert.match(csv,/106,66/);
 await admin.screenshot({path:'test-results/parcelamento-admin.png',fullPage:true});assert.equal(app.publicApi('capacity').data.remaining,196);
 app.setTime('2026-10-24T15:00:00Z');const testRow=app.publicApi('create',registration({name:'Família Lembrete',phone:'37999993333',plan:'THRICE',remindersEnabled:true}));assert.equal(testRow.ok,true,testRow.error);await admin.locator('#reload').click();
 await admin.locator('#reminders-list').getByText('Família Lembrete',{exact:true}).waitFor();const popup=admin.waitForEvent('popup');await admin.locator('#reminders-list').getByRole('link',{name:'ABRIR WHATSAPP',exact:true}).click();const chat=await popup;await chat.waitForLoadState();const url=new URL(chat.url());assert.equal(url.pathname,'/5537999993333');assert.match(url.searchParams.get('text'),/vence amanhã/);assert.ok(!url.searchParams.get('text').includes(testRow.data.token));await chat.close();await admin.getByText(/Conversa aberta\. Confira a mensagem/).waitFor();
 assert.deepEqual(errors,[]);assert.ok(requests.every(url=>url.startsWith(base)||url.startsWith('data:')||url.startsWith('https://wa.me/')));
 console.log('Parcelamento no navegador: 3x, centavos, parcelas vencidas juntas, depósito, Pix, comprovantes por pagamento, primeira parcela garante, saldo, CSV e lembrete manual sem envio real aprovados.');
}finally{await browser?.close();await new Promise(r=>server.close(r));}
