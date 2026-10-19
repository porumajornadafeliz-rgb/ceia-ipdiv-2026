import test from 'node:test';
import assert from 'node:assert/strict';
import {platform,registration,proofFixture} from './platform.mjs';
const value=r=>{assert.equal(r.ok,true,r.error);return r.data;};
const access=r=>({id:r.id,token:r.token});
const upload=(p,r,part=1,other={})=>p.publicApi('proof',{...access(r),...proofFixture,parts:[part],...other});
const current=(p,r)=>value(p.publicApi('lookup',access(r)));
const note='Comprovante e recebimento conferidos na conta da igreja; confirmação registrada no painel.';
test('confirmação financeira da versão baixada preserva a reserva e o saldo das outras parcelas',()=>{
 for(const plan of ['ONCE','TWICE','THRICE']){
  const p=platform(),r=value(p.publicApi('create',registration({plan}))),submitted=value(upload(p,r));
  assert.equal(submitted.reservationStatus,'RESERVED');assert.equal(submitted.payment.received,0);
  const proof=value(p.adminApi('getProof',{id:r.id,part:1}));assert.equal(proof.data,proofFixture.data);
  const confirmed=value(p.adminApi('payment',{id:r.id,part:1,approved:true,proofVersion:proof.version,note}));
  assert.equal(confirmed.reservationStatus,'RESERVED');assert.equal(confirmed.payment.received,r.payment.parts[0].amount);assert.equal(confirmed.payment.balance,r.total-r.payment.parts[0].amount);
  assert.equal(confirmed.paymentStatus,plan==='ONCE'?'PAID':'PARTIALLY_PAID');assert.equal(value(p.publicApi('capacity')).remaining,199);
  const audit=confirmed.audit.filter(a=>a.action==='PAYMENT_CONFIRMED');assert.equal(audit.length,1);assert.ok(audit[0].by);assert.ok(audit[0].at);assert.equal(audit[0].note,note);
  value(p.adminApi('payment',{id:r.id,part:1,approved:true,proofVersion:proof.version,note}));assert.equal(value(p.adminApi('list')).rows[0].audit.filter(a=>a.action==='PAYMENT_CONFIRMED').length,1);
  if(plan!=='ONCE')assert.equal(p.adminApi('entry',{id:r.id}).ok,false);
 }
});
test('consultas de comprovantes anteriores preservam a base, configurações e pagamentos já confirmados',()=>{
 const p=platform(),paid=value(p.publicApi('create',registration({plan:'TWICE'}))),pending=value(p.publicApi('create',registration()));
 value(upload(p,paid));value(upload(p,pending));const version=value(p.adminApi('getProof',{id:paid.id,part:1})).version;
 value(p.adminApi('payment',{id:paid.id,part:1,approved:true,proofVersion:version,note}));
 const before=JSON.stringify(p.sheets.get('Inscricoes').rows),props=JSON.stringify(p.properties);
 assert.equal(current(p,paid).reservationStatus,'RESERVED');assert.equal(current(p,pending).reservationStatus,'RESERVED');assert.equal(value(p.adminApi('list')).metrics.receivedTotal,4000);
 value(p.adminApi('getProof',{id:pending.id,part:1}));assert.equal(JSON.stringify(p.sheets.get('Inscricoes').rows),before);assert.equal(JSON.stringify(p.properties),props);
});
test('arquivo inválido e falha ao salvar não geram confirmação ou arquivo órfão',()=>{
 const p=platform(),r=value(p.publicApi('create',registration({plan:'ONCE'})));
 assert.equal(upload(p,r,1,{data:Buffer.from('<html>invalid</html>').toString('base64')}).ok,false);
 const sheet=p.sheets.get('Inscricoes'),range=sheet.getRange.bind(sheet),before=JSON.stringify(sheet.rows);
 sheet.getRange=(...args)=>{const result=range(...args);if(args[0]===2&&args[1]===1)result.setValues=()=>{throw new Error('Falha simulada de gravação');};return result;};
 assert.equal(upload(p,r).ok,false);assert.equal(JSON.stringify(sheet.rows),before);assert.equal(p.files.size,0);assert.equal(current(p,r).reservationStatus,'RESERVED');assert.equal(value(p.adminApi('list')).metrics.receivedTotal,0);
});
