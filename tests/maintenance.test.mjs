import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';
import { platform, registration, proofFixture } from './platform.mjs';
const code = readFileSync(new URL('../scripts/maintenance/LIMPAR_TESTES.gs', import.meta.url),'utf8');
const value = r => { assert.equal(r.ok,true,r.error);return r.data; };
function setup() {const p=platform();vm.runInContext(code,p.public);p.public.console={log(){}};return p;}
test('limpeza só permite a conta proprietária e não é uma ação pública',()=>{
 const p=setup();value(p.publicApi('create',registration()));
 for(const [user,owner] of [['','porumajornadafeliz@gmail.com'],['intruso@example.test','porumajornadafeliz@gmail.com'],['porumajornadafeliz@gmail.com','outro@example.test']]) {
  p.setPublicIdentity(user,owner);assert.throws(()=>p.public.limparTestesAntesDaDivulgacao(),/proprietária/);
 }
 assert.equal(p.publicApi('limparTestesAntesDaDivulgacao',{}).ok,false);assert.equal(value(p.adminApi('list')).rows.length,1);
 assert.equal(p.sheets.size,1);assert.equal(p.properties.LIMPEZA_TESTES_2026,undefined);
});
test('copia testes e documentos vinculados antes de zerar a base, preservando configurações e cabeçalho',()=>{
 const p=setup(),row=value(p.publicApi('create',registration()));
 value(p.publicApi('proof',{id:row.id,token:row.token,...proofFixture}));value(p.publicApi('create',registration()));
 const snapshot=JSON.stringify(p.sheets.get('Inscricoes').rows),props=JSON.stringify(p.properties),files=p.files.size;
 p.setPublicIdentity('porumajornadafeliz@gmail.com');const result=p.public.limparTestesAntesDaDivulgacao();
 assert.equal(result.inscricoes,0);assert.equal(result.vagasRestantes,200);assert.equal(result.testesArquivados,2);
 assert.equal(JSON.stringify(p.sheets.get(result.arquivo).rows),snapshot);assert.equal(p.files.size,files);
 const original=JSON.parse(props);for(const [key,val] of Object.entries(original)) assert.equal(p.properties[key],val,key);
 assert.deepEqual(p.sheets.get('Inscricoes').rows[0],JSON.parse(snapshot)[0]);
 assert.equal(value(p.adminApi('list')).rows.length,0);assert.equal(value(p.adminApi('list')).metrics.receivedTotal,0);
 assert.equal(p.publicApi('lookup',{id:row.id,token:row.token}).ok,false);
});
test('repetição não limpa novas inscrições, inclusive após retorno interrompido',()=>{
 const p=setup();p.setPublicIdentity('porumajornadafeliz@gmail.com');p.public.limparTestesAntesDaDivulgacao();
 value(p.publicApi('create',registration()));assert.equal(p.public.limparTestesAntesDaDivulgacao().alterado,false);
 assert.equal(value(p.adminApi('list')).rows.length,1);
 p.properties.LIMPEZA_TESTES_2026=JSON.stringify({estado:'copia_validada'});
 assert.equal(p.public.limparTestesAntesDaDivulgacao().alterado,false);assert.equal(value(p.publicApi('capacity')).remaining,199);
});
test('falha ao validar a cópia, lock ocupado ou limite divergente deixam o original intacto',()=>{
 for(const mode of ['copy','lock','limit']) {
  const p=setup();value(p.publicApi('create',registration()));p.setPublicIdentity('porumajornadafeliz@gmail.com');
  const original=JSON.stringify(p.sheets.get('Inscricoes').rows);
  if(mode==='copy') p.sheets.get('Inscricoes').copyTo=()=>({setName(){},getRange:()=>({getValues:()=>[]})});
  if(mode==='lock')p.lock(true);if(mode==='limit')p.properties.MAX_PARTICIPANTS='100';
  assert.throws(()=>p.public.limparTestesAntesDaDivulgacao());assert.equal(JSON.stringify(p.sheets.get('Inscricoes').rows),original);
  assert.equal(p.properties.LIMPEZA_TESTES_2026,undefined);
 }
});
