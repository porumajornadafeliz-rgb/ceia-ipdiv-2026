import assert from 'node:assert/strict';
import {chromium} from '@playwright/test';
import {PNG} from 'pngjs';
import {readFile} from 'node:fs/promises';
import {preview} from '../scripts/preview.mjs';
import {registration} from './platform.mjs';
const {server,app}=preview(0);await new Promise(r=>server.on('listening',r));const base='http://127.0.0.1:'+server.address().port;let browser;
const value=r=>{assert.equal(r.ok,true,r.error);return r.data;};
const receipt={name:'proof.pdf',mimeType:'application/pdf',buffer:Buffer.from('%PDF-1.4\nSynthetic proof for browser test\n%%EOF')};
async function enableProductionFlow(page,blocked=false){await page.evaluate(blocked=>{
 // Executa a interface de produção, mas mantém TODA gravação na API local de teste.
 window.google={script:{run:{withSuccessHandler(ok){return{withFailureHandler(bad){return{publicApi(action,input){fetch('/api/public',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action,input})}).then(r=>r.json()).then(ok).catch(bad);}};}};}}}};
 window.CEIA_DEMO=false;if(blocked)window.open=()=>null;
},blocked);}
try{
 browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox']});
 const context=await browser.newContext({viewport:{width:390,height:844}});context.setDefaultTimeout(15000);const errors=[],requests=[];
 context.on('page',p=>p.on('pageerror',e=>errors.push(e.message)));context.on('request',r=>requests.push(r.url()));
 await context.route('https://wa.me/**',r=>r.fulfill({status:200,contentType:'text/html',body:'Mensagem interceptada no teste; nenhum envio real.'}));
 const page=await context.newPage();await page.goto(base);await page.locator('#begin').click();
 await page.locator('#name').fill('Família Confirmação Simples');await page.locator('#phone').fill('37999993333');await page.locator('#plus-adultMembers').click();
 await page.locator('#review-button').click();await page.locator('#confirm').click();await page.locator('#payment-plan').selectOption('TWICE');await page.locator('#choose-payment-plan').click();await page.locator('#proof-file').waitFor();
 const id=await page.locator('#registration-id').innerText(),row=value(app.adminApi('list')).rows[0];assert.equal(row.id,id);assert.equal(row.reservationStatus,'RESERVED');
 await enableProductionFlow(page);
 await page.locator('#proof-file').setInputFiles({...receipt,buffer:Buffer.from('<html>invalid PDF payload</html>')});const invalidPopup=context.waitForEvent('page');await page.locator('#proof-button').click();const blank=await invalidPopup;
 await page.getByText('O conteúdo do arquivo não corresponde a PDF, PNG ou JPG.',{exact:true}).waitFor();if(!blank.isClosed())await blank.waitForEvent('close');
 assert.equal(app.files.size,0);assert.equal(value(app.adminApi('list')).rows[0].reservationStatus,'RESERVED');assert.equal(requests.filter(url=>url.startsWith('https://wa.me/')).length,0);
 await page.locator('#proof-file').setInputFiles(receipt);const popup=context.waitForEvent('page');await page.locator('#proof-button').click();const chat=await popup;await chat.waitForURL(url=>url.hostname==='wa.me');
 const url=new URL(chat.url()),text=url.searchParams.get('text');assert.equal(url.pathname,'/553732124980');assert.match(text,/Família Confirmação Simples/);assert.match(text,/Participantes: 2/);assert.match(text,/Plano: 2 vezes/);assert.match(text,/RESERVA PROVISÓRIA/);assert.match(text,/COMPROVANTE EM CONFERÊNCIA/);assert.match(text,/80,00/);
 const token=await page.evaluate(()=>access.token);assert.ok(!text.includes(token));await chat.close();await page.locator('#payment-status').getByText('RESERVA PROVISÓRIA',{exact:true}).waitFor();
 assert.equal(value(app.adminApi('list')).metrics.receivedTotal,0);assert.equal(value(app.adminApi('list')).metrics.confirmedPeople,0);assert.equal(value(app.publicApi('capacity')).remaining,198);assert.equal(app.files.size,1);
 await page.locator('#payment-success').getByText(/Aguarde a conferência da secretaria/).waitFor();assert.match(await page.locator('#payment-controls').innerText(),/toque em Enviar/);
 const second=value(app.publicApi('create',registration({name:'Família Sem Popup',phone:'37999994444',plan:'TWICE'})));
 const limited=await context.newPage();await limited.goto(base);await limited.locator('#open-lookup').click();await limited.locator('#status-name').fill(second.name);await limited.locator('#status-phone').fill(second.phone);await limited.locator('#status-lookup-button').click();
 await limited.getByRole('button',{name:'VER PAGAMENTOS / ENVIAR COMPROVANTE',exact:true}).click();await limited.locator('.lookup-payment-box select').selectOption('TWICE');await limited.getByRole('button',{name:'CONTINUAR PARA PAGAMENTO',exact:true}).click();await limited.getByLabel('Comprovante desta inscrição').waitFor();
 const image=new PNG({width:768,height:1600});image.data.fill(255);const png={name:'proof.png',mimeType:'image/png',buffer:PNG.sync.write(image)};
 await enableProductionFlow(limited,true);await limited.getByLabel('Comprovante desta inscrição').setInputFiles(png);await limited.locator('.lookup-payment-box').getByRole('button',{name:'ENVIAR COMPROVANTE',exact:true}).click();
 await limited.locator('.lookup-reservation-state').getByText('RESERVA PROVISÓRIA',{exact:true}).waitFor();await limited.locator('.proof-whatsapp-link').waitFor();
 const fallback=new URL(await limited.locator('.proof-whatsapp-link').getAttribute('href'));assert.equal(fallback.pathname,'/553732124980');assert.match(fallback.searchParams.get('text'),/Família Sem Popup/);assert.ok(!fallback.searchParams.get('text').includes(second.token));
 assert.equal(value(app.adminApi('list')).metrics.receivedTotal,0);assert.equal(value(app.publicApi('capacity')).remaining,197);assert.match(await limited.locator('.lookup-payment-state').innerText(),/COMPROVANTE EM CONFERÊNCIA/);
 const pending=value(app.publicApi('create',registration({name:'Família Sem Comprovante',phone:'37999995555',plan:'TWICE'})));
 const admin=await context.newPage();await admin.goto(base+'/admin');
 const pendingRow=admin.locator('#table-body tr').filter({hasText:pending.name}),pendingBox=pendingRow.getByRole('checkbox',{name:'Vaga garantida',exact:true});
 assert.equal(await admin.getByRole('checkbox',{name:'Vaga garantida',exact:true}).count(),3,'Uma caixa visível em cada inscrição, inclusive sem comprovante');assert.equal(await pendingBox.isVisible(),true);assert.equal(await pendingBox.isChecked(),false);assert.equal(await pendingBox.isDisabled(),true);await pendingRow.getByText('RESERVA PROVISÓRIA',{exact:true}).waitFor();
 const secondRow=admin.locator('#table-body tr').filter({hasText:second.name});
 const mark=secondRow.getByRole('checkbox',{name:'Vaga garantida',exact:true});assert.equal(await mark.isDisabled(),true);
 const download=admin.waitForEvent('download');await secondRow.getByRole('button',{name:'BAIXAR COMPROVANTE · 1',exact:true}).click();
 assert.deepEqual(await readFile(await(await download).path()),png.buffer);assert.equal(await mark.isEnabled(),true);
 const beforeFirst=JSON.stringify(value(app.adminApi('list')).rows.find(r=>r.id===id));
 // Um clique confirma só a primeira parcela, sem formulário. Cliques repetidos são bloqueados enquanto grava.
 await mark.click();await secondRow.getByText('PAGAMENTO PARCIAL',{exact:true}).waitFor();await secondRow.getByText('VAGA GARANTIDA',{exact:true}).waitFor();
 const listing=value(app.adminApi('list')),paid=listing.rows.find(r=>r.id===second.id);
 assert.equal(await mark.isChecked(),true);assert.equal(await mark.isDisabled(),true);assert.equal(await mark.evaluate(e=>getComputedStyle(e).backgroundColor),'rgb(22, 119, 210)','Caixa confirmada marcada em azul');
 assert.equal(listing.metrics.receivedTotal,4000);assert.equal(paid.payment.balance,4000);assert.equal(paid.audit.filter(a=>a.action==='PAYMENT_CONFIRMED').length,1);
 assert.equal(JSON.stringify(listing.rows.find(r=>r.id===id)),beforeFirst,'Outra família não é alterada');
 assert.equal(await admin.locator('#action-dialog').isVisible(),false);
 await admin.reload();await secondRow.getByRole('checkbox',{name:'Vaga garantida',exact:true}).waitFor();assert.equal(await mark.isChecked(),true,'A caixa permanece marcada após reabrir o painel');assert.equal(await pendingBox.isChecked(),false);assert.equal(value(app.publicApi('capacity')).remaining,196);
 await limited.locator('#status-lookup-button').click();await limited.locator('.lookup-reservation-state').getByText('VAGA GARANTIDA',{exact:true}).waitFor();
 // Atualização limitada acompanha a confirmação feita em outra aba.
 await limited.getByRole('button',{name:'VER PAGAMENTOS / ENVIAR COMPROVANTE',exact:true}).click();await limited.locator('.lookup-payment-state').getByText('PAGAMENTO PARCIAL',{exact:true}).waitFor();
 // A secretaria mantém a possibilidade de recusar uma divergência e precisa baixar a nova versão.
 const firstRow=admin.locator('#table-body tr').filter({hasText:'Família Confirmação Simples'}),oldDownload=admin.waitForEvent('download');
 await firstRow.getByRole('button',{name:'BAIXAR COMPROVANTE · 1',exact:true}).click();await oldDownload;
 await firstRow.getByText('Outras ações · 1',{exact:true}).click();await firstRow.getByRole('button',{name:'RECUSAR COMPROVANTE · 1',exact:true}).click();
 await admin.getByLabel('Motivo obrigatório').fill('Comprovante divergente no cenário simulado');await admin.locator('#submit-action').click();await admin.locator('#action-dialog').waitFor({state:'hidden'});
 const other=Buffer.from('%PDF-1.4\nReplacement proof\n%%EOF').toString('base64');value(app.publicApi('proof',{id,token,data:other,mime:'application/pdf',parts:[1]}));
 await admin.locator('#reload').click();await firstRow.getByRole('checkbox',{name:'Vaga garantida',exact:true}).click();
 await admin.locator('#admin-error').getByText(/O comprovante mudou/).waitFor();assert.equal(value(app.adminApi('list')).rows.find(r=>r.id===id).reservationStatus,'RESERVED');
 assert.equal(await firstRow.getByRole('checkbox',{name:'Vaga garantida',exact:true}).isDisabled(),true);
 const replacementDownload=admin.waitForEvent('download');await firstRow.getByRole('button',{name:'BAIXAR COMPROVANTE · 1',exact:true}).click();
 assert.equal((await readFile(await(await replacementDownload).path())).toString('base64'),other);
 await firstRow.getByRole('checkbox',{name:'Vaga garantida',exact:true}).click();await firstRow.getByText('VAGA GARANTIDA',{exact:true}).waitFor();
 assert.equal(value(app.adminApi('list')).metrics.receivedTotal,12000);assert.equal(value(app.publicApi('capacity')).remaining,196);
 assert.deepEqual(errors,[]);assert.ok(requests.every(url=>url.startsWith(base)||url.startsWith('blob:'+base)||url.startsWith('data:')||url.startsWith('https://wa.me/')));
 console.log('Caixa por inscrição, inclusive sem comprovante; marcação persistente após recarregar; confirmação simples e WhatsApp: comprovante mantém reserva provisória; download antes de marcar; clique único, saldo, histórico, recusa, versão substituída e consulta atualizada aprovados. Conversa após salvar e alternativa com popup bloqueado verificadas sem mensagem real.');
}finally{await browser?.close();await new Promise(r=>server.close(r));}
