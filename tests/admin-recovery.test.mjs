import test from 'node:test';
import assert from 'node:assert/strict';
import {platform,registration} from './platform.mjs';
const value=r=>{assert.equal(r.ok,true,r.error);return r.data;};
const response=(status,body)=>({getResponseCode:()=>status,getContentText:()=>body});
function html(p){p.admin.HtmlService={createHtmlOutput:source=>({getContent:()=>source}),createTemplateFromFile:()=>({evaluate:()=>({setTitle(){return this;},addMetaTag(){return this;},getContent:()=>'<h1>Painel autorizado</h1>'})})};}
test('falha transitória ao identificar a conta é repetida uma vez e não mostra acesso restrito',()=>{
 const p=platform();html(p);const original=p.admin.UrlFetchApp.fetch,requests=[];
 p.admin.UrlFetchApp.fetch=(url,options)=>{requests.push(JSON.parse(JSON.parse(options.payload).payload));return requests.length===1?response(503,'unavailable'):original(url,options);};
 assert.match(p.admin.doGet().getContent(),/Painel autorizado/);assert.equal(requests.length,2);assert.notEqual(requests[0].nonce,requests[1].nonce);assert.ok(requests.every(r=>r.action==='whoami'));
});
test('resposta HTML e indisponibilidade persistente exibem comunicação, sem chamar conta autorizada de restrita',()=>{
 for(const status of [200,503]){
  const p=platform();html(p);let attempts=0;p.admin.UrlFetchApp.fetch=()=>{attempts++;return response(status,'<script>PRIVATE_INTERNAL_DETAIL</script>');};
  const page=p.admin.doGet().getContent();assert.equal(attempts,2);assert.match(page,/Painel temporariamente indisponível/);assert.ok(!page.includes('Acesso restrito'));assert.ok(!page.includes('PRIVATE_INTERNAL_DETAIL'));
 }
});
test('conta realmente não autorizada e identidade ausente permanecem restritas, sem repetição',()=>{
 for(const account of ['intruso@example.test','']){
  const p=platform({actor:account});html(p);const original=p.admin.UrlFetchApp.fetch;let attempts=0;p.admin.UrlFetchApp.fetch=(...args)=>{attempts++;return original(...args);};
  assert.match(p.admin.doGet().getContent(),/Acesso restrito/);assert.equal(attempts,account?1:0);
 }
});
test('configuração e autorização de conexão têm mensagens próprias sem expor valores ou alterar dados',()=>{
 const p=platform();html(p);delete p.adminProperties.PUBLIC_WEB_APP_URL;assert.match(p.admin.doGet().getContent(),/Configuração administrativa pendente/);
 p.adminProperties.PUBLIC_WEB_APP_URL='https://script.google.com/macros/s/TEST/exec';let count=0;p.admin.UrlFetchApp.fetch=()=>{count++;throw new Error('Authorization required: PRIVATE_INTERNAL_DETAIL');};
 const page=p.admin.doGet().getContent();assert.match(page,/Autorização Google pendente/);assert.ok(!page.includes('PRIVATE_INTERNAL_DETAIL'));assert.equal(count,1);
});
test('consulta lista repete falha transitória, mas uma alteração com resposta perdida não é reenviada',()=>{
 const p=platform(),r=value(p.publicApi('create',registration())),original=p.admin.UrlFetchApp.fetch;let calls=0;
 p.admin.UrlFetchApp.fetch=(...args)=>++calls===1?response(502,'bad gateway'):original(...args);
 const row=value(p.adminApi('list')).rows[0];assert.equal(calls,2);assert.equal(row.id,r.id);
 calls=0;p.admin.UrlFetchApp.fetch=(...args)=>{calls++;original(...args);throw new Error('network response lost');};
 assert.equal(p.adminApi('reservation',{id:r.id,confirmed:true,version:row.reservationVersion}).ok,false);assert.equal(calls,1,'Alteração não é reenviada automaticamente com outro nonce');
 p.admin.UrlFetchApp.fetch=original;const current=value(p.adminApi('list')).rows[0];assert.equal(current.reservationStatus,'CONFIRMED');assert.equal(current.audit.filter(a=>a.action==='RESERVATION_CONFIRMED').length,1);assert.equal(current.payment.received,0);
});
