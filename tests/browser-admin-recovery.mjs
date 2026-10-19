import assert from 'node:assert/strict';
import {chromium} from '@playwright/test';
import {preview} from '../scripts/preview.mjs';
import {registration,proofFixture} from './platform.mjs';
const {server,app}=preview(0);await new Promise(r=>server.on('listening',r));const base='http://127.0.0.1:'+server.address().port;let browser;
const v=r=>{assert.equal(r.ok,true,r.error);return r.data;};
try{
 const paid=v(app.publicApi('create',registration({name:'Família Parcial Anterior',phone:'37999990001',plan:'TWICE'})));
 v(app.publicApi('proof',{id:paid.id,token:paid.token,...proofFixture,parts:[1]}));const proof=v(app.adminApi('getProof',{id:paid.id,part:1}));
 v(app.adminApi('payment',{id:paid.id,part:1,approved:true,proofVersion:proof.version,note:'Primeira parcela conferida antes da atualização'}));
 const cells=app.sheets.get('Inscricoes').rows.find(row=>row[0]===paid.id),audit=JSON.parse(cells[17]);audit.forEach(a=>delete a.reservationConfirmed);cells[17]=JSON.stringify(audit);
 const free=v(app.publicApi('create',registration({name:'Família Sem Arquivo',phone:'37999990002',plan:'TWICE'})));
 browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox']});const context=await browser.newContext();context.setDefaultTimeout(15000);
 const requests=[],errors=[];let mode='',release;
 await context.route('**/api/admin',async route=>{const data=route.request().postDataJSON();requests.push(data);
  if(data.action==='reservation'&&mode==='wait'){mode='';await new Promise(resolve=>release=resolve);}
  if(data.action==='reservation'&&mode==='fail'){mode='';return route.fulfill({status:503,body:'unavailable'});}
  if(data.action==='reservation'&&mode==='lost'){mode='';await route.fetch();return route.fulfill({status:503,body:'response lost after save'});}
  return route.continue();
 });
 const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));await page.goto(base+'/admin');
 const oldRow=page.locator('#table-body tr').filter({hasText:paid.name}),oldBox=oldRow.getByRole('checkbox',{name:'CONFIRMAR',exact:true});await oldBox.waitFor();assert.equal(await oldBox.isChecked(),true);
 let navigations=0;page.on('framenavigated',()=>navigations++);const initialLists=requests.filter(r=>r.action==='list').length;
 const before=JSON.stringify(v(app.adminApi('list')).rows.find(r=>r.id===paid.id).payment);
 await oldBox.click();await oldRow.getByText('RESERVA PROVISÓRIA',{exact:true}).waitFor();await oldBox.click();await oldRow.getByText('VAGA GARANTIDA',{exact:true}).waitFor();
 assert.equal(requests.filter(r=>r.action==='list').length,initialLists,'Um clique bem-sucedido não faz uma segunda consulta completa');assert.equal(navigations,0,'Caixa não navega nem recarrega a página');assert.equal(page.url(),base+'/admin');
 assert.equal(JSON.stringify(v(app.adminApi('list')).rows.find(r=>r.id===paid.id).payment),before);assert.deepEqual(await page.evaluate(()=>state.metrics),v(app.adminApi('list')).metrics);
 const freeRow=page.locator('#table-body tr').filter({hasText:free.name}),freeBox=freeRow.getByRole('checkbox',{name:'CONFIRMAR',exact:true});mode='wait';await freeBox.click();await freeRow.getByText('Salvando alteração…',{exact:true}).waitFor();assert.equal(await freeBox.isDisabled(),true);release();
 await freeRow.getByText('VAGA GARANTIDA',{exact:true}).waitFor();assert.equal(await freeBox.isEnabled(),true);assert.equal(v(app.adminApi('list')).metrics.receivedTotal,4000);
 mode='fail';await freeBox.click();await page.locator('#admin-error').getByText(/Não foi possível conectar/).waitFor();assert.equal(await freeBox.isChecked(),true,'Falha antes de salvar restaura o estado confirmado');
 mode='lost';await freeBox.click();await page.locator('#admin-error').getByText(/Não foi possível conectar/).waitFor();await freeRow.getByText('RESERVA PROVISÓRIA',{exact:true}).waitFor();assert.equal(await freeBox.isChecked(),false,'Se a resposta se perde depois de salvar, a consulta recupera o estado real');
 assert.deepEqual(await page.evaluate(()=>state.metrics),v(app.adminApi('list')).metrics);assert.equal(v(app.adminApi('list')).rows.find(r=>r.id===free.id).audit.filter(a=>a.action.startsWith('RESERVATION_')).length,2);assert.equal(navigations,0);assert.deepEqual(errors,[]);
 console.log('Recuperação administrativa: primeira parcela antiga preservada, marcar/desmarcar sem navegação nem segunda consulta completa, indicadores consistentes e falhas antes/depois da gravação recuperadas.');
}finally{await browser?.close();await new Promise(r=>server.close(r));}
