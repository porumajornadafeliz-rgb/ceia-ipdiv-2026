import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {platform,registration,proofFixture,pay} from './platform.mjs';
const code=readFileSync(new URL('../scripts/maintenance/LIMPAR_TESTES_FINAIS.gs',import.meta.url),'utf8');
const key='LIMPEZA_FINAL_DIVULGACAO_20261018';
const value=r=>{assert.equal(r.ok,true,r.error);return r.data;};
function setup(){const p=platform();vm.runInContext(code,p.public);p.public.console={log(){}};return p;}
test('limpeza final exige proprietário no editor e não pode ser chamada pelo app público',()=>{
 const p=setup();value(p.publicApi('create',registration()));
 for(const [user,owner] of [['','porumajornadafeliz@gmail.com'],['outra@example.test','porumajornadafeliz@gmail.com'],['porumajornadafeliz@gmail.com','outra@example.test']]){
  p.setPublicIdentity(user,owner);assert.throws(()=>p.public.limparNovosTestesParaDivulgar(),/proprietária/);
 }
 assert.equal(p.publicApi('limparNovosTestesParaDivulgar',{}).ok,false);assert.equal(value(p.adminApi('list')).rows.length,1);assert.equal(p.properties[key],undefined);
});
test('nova autorização arquiva e limpa testes atuais sem remover o marcador anterior, comprovantes ou configurações',()=>{
 const p=setup();p.properties.LIMPEZA_TESTES_2026='limpeza anterior concluída';
 const row=value(p.publicApi('create',registration({plan:'THRICE',remindersEnabled:true})));
 value(p.publicApi('proof',{id:row.id,token:row.token,...proofFixture,parts:[1],method:'DEPOSIT'}));
 const paid=value(p.publicApi('create',registration()));pay(p,paid);
 const sheet=p.sheets.get('Inscricoes'),before=JSON.stringify(sheet.rows),props={...p.properties},files=p.files.size;
 p.setPublicIdentity('porumajornadafeliz@gmail.com');const result=p.public.limparNovosTestesParaDivulgar();
 assert.equal(result.inscricoes,0);assert.equal(result.vagasRestantes,200);assert.equal(result.testesArquivados,2);
 assert.equal(JSON.stringify(p.sheets.get(result.arquivo).rows),before);assert.equal(p.files.size,files);
 for(const [k,v]of Object.entries(props))assert.equal(p.properties[k],v,k);
 assert.deepEqual(sheet.rows[0],JSON.parse(before)[0]);
 const list=value(p.adminApi('list'));assert.equal(list.rows.length,0);assert.equal(list.metrics.receivedTotal,0);assert.equal(list.reminders.length,0);
 assert.equal(p.publicApi('lookup',{id:row.id,token:row.token}).ok,false);assert.equal(p.publicApi('lookup',{id:paid.id,token:paid.token}).ok,false);
 assert.equal(value(p.publicApi('status',{name:row.name,phone:row.phone})).registrations.length,0);
});
test('repetir a limpeza final preserva cadastros novos, inclusive depois de interrupção',()=>{
 const p=setup();p.setPublicIdentity('porumajornadafeliz@gmail.com');p.public.limparNovosTestesParaDivulgar();
 value(p.publicApi('create',registration()));assert.equal(p.public.limparNovosTestesParaDivulgar().alterado,false);assert.equal(value(p.adminApi('list')).rows.length,1);
 p.properties[key]=JSON.stringify({estado:'copia_validada'});assert.equal(p.public.limparNovosTestesParaDivulgar().alterado,false);assert.equal(value(p.publicApi('capacity')).remaining,199);
});
test('limpeza final mantém os dados se não validar cópia, obter lock ou encontrar limite de 200',()=>{
 for(const mode of ['copy','lock','limit']){
  const p=setup();value(p.publicApi('create',registration()));p.setPublicIdentity('porumajornadafeliz@gmail.com');const before=JSON.stringify(p.sheets.get('Inscricoes').rows);
  if(mode==='copy')p.sheets.get('Inscricoes').copyTo=()=>({setName(){},getRange:()=>({getValues:()=>[]})});
  if(mode==='lock')p.lock(true);if(mode==='limit')p.properties.MAX_PARTICIPANTS='100';
  assert.throws(()=>p.public.limparNovosTestesParaDivulgar());assert.equal(JSON.stringify(p.sheets.get('Inscricoes').rows),before);assert.equal(p.properties[key],undefined);
 }
});
