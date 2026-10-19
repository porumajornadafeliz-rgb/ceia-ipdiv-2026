import test from 'node:test';
import assert from 'node:assert/strict';
import {platform,registration,proofFixture} from './platform.mjs';
const value=r=>{assert.equal(r.ok,true,r.error);return r.data;};
const access=r=>({id:r.id,token:r.token});
const listed=(p,r)=>value(p.adminApi('list')).rows.find(row=>row.id===r.id);
const set=(p,r,confirmed,extra={})=>p.adminApi('reservation',{id:r.id,confirmed,version:listed(p,r).reservationVersion,...extra});
const lookup=(p,r)=>value(p.publicApi('lookup',access(r)));
const receive=(p,r,number=1)=>{value(p.publicApi('proof',{...access(r),...proofFixture,parts:[number]}));const file=value(p.adminApi('getProof',{id:r.id,part:number}));return value(p.adminApi('payment',{id:r.id,part:number,proofVersion:file.version,approved:true,note:'Recebimento bancário conferido no cenário local'}));};
test('secretaria marca e desmarca sem comprovante; doação não cria recebimento nem muda saldo',()=>{
 const p=platform(),r=value(p.publicApi('create',registration({plan:'TWICE'}))),before=listed(p,r).payment;
 const confirmed=value(set(p,r,true));assert.equal(confirmed.reservationStatus,'CONFIRMED');assert.deepEqual(confirmed.payment,before);assert.equal(confirmed.hasProof,false);assert.equal(p.files.size,0);
 assert.equal(lookup(p,r).reservationStatus,'CONFIRMED');assert.equal(value(p.adminApi('list')).metrics.receivedTotal,0);assert.equal(value(p.publicApi('capacity')).remaining,199);
 const released=value(set(p,r,false));assert.equal(released.reservationStatus,'RESERVED');assert.deepEqual(released.payment,before);assert.equal(lookup(p,r).reservationStatus,'RESERVED');assert.equal(value(p.publicApi('capacity')).remaining,199);
 const changed=released.audit.filter(a=>a.action.startsWith('RESERVATION_'));assert.equal(changed.length,2);assert.equal(changed[0].by,'tesouraria@example.test');assert.ok(changed[1].at);assert.equal(changed[0].reservationConfirmed,true);assert.equal(changed[1].reservationConfirmed,false);
});
test('recebimento e garantia são independentes; desmarcar após pagamento preserva dinheiro e comprovante',()=>{
 const p=platform(),r=value(p.publicApi('create',registration({plan:'TWICE'})));
 const received=receive(p,r);assert.equal(received.payment.received,4000);assert.equal(received.reservationStatus,'RESERVED');
 value(set(p,r,true));const before=JSON.stringify(listed(p,r).payment);value(set(p,r,false));assert.equal(lookup(p,r).reservationStatus,'RESERVED');assert.equal(JSON.stringify(listed(p,r).payment),before);assert.equal(p.files.size,1);
 const data=Buffer.from('%PDF-1.4\nSecond proof\n%%EOF').toString('base64');value(p.publicApi('proof',{...access(r),...proofFixture,data,parts:[2]}));const file=value(p.adminApi('getProof',{id:r.id,part:2}));
 value(p.adminApi('payment',{id:r.id,part:2,approved:true,proofVersion:file.version,note:'Segundo recebimento conferido'}));assert.equal(lookup(p,r).paymentStatus,'PAID');assert.equal(lookup(p,r).reservationStatus,'RESERVED');assert.equal(value(p.adminApi('list')).metrics.receivedTotal,8000);
 value(set(p,r,true));assert.equal(lookup(p,r).reservationStatus,'CONFIRMED');assert.equal(lookup(p,r).payment.received,8000);
});
test('confirmações anteriores continuam garantidas até a secretaria desmarcar, sem migração ou perda financeira',()=>{
 const p=platform(),r=value(p.publicApi('create',registration()));receive(p,r);
 const sheet=p.sheets.get('Inscricoes'),cells=sheet.rows.find(row=>row[0]===r.id);const audit=JSON.parse(cells[17]);audit.forEach(a=>delete a.reservationConfirmed);cells[17]=JSON.stringify(audit);
 const before=JSON.stringify(sheet.rows),props=JSON.stringify(p.properties);assert.equal(lookup(p,r).reservationStatus,'CONFIRMED');assert.equal(JSON.stringify(sheet.rows),before);assert.equal(JSON.stringify(p.properties),props);
 value(set(p,r,false));assert.equal(lookup(p,r).reservationStatus,'RESERVED');assert.equal(lookup(p,r).payment.received,8000);value(set(p,r,true));assert.equal(lookup(p,r).reservationStatus,'CONFIRMED');
});
test('garantia não depende da troca do plano; marcação e desmarcação continuam após reler a planilha',()=>{
 const p=platform(),r=value(p.publicApi('create',registration()));value(set(p,r,true));
 value(p.publicApi('paymentPlan',{...access(r),plan:'THRICE'}));assert.equal(lookup(p,r).reservationStatus,'CONFIRMED');assert.equal(lookup(p,r).payment.parts.length,3);
 value(set(p,r,false));assert.equal(lookup(p,r).reservationStatus,'RESERVED');assert.equal(lookup(p,r).payment.received,0);
});
test('conta de entrada, usuário público e dados inválidos não alteram garantia',()=>{
 const p=platform(),r=value(p.publicApi('create',registration()));p.setActor('entrada@example.test');assert.equal(p.adminApi('reservation',{id:r.id,confirmed:true,version:'0:RESERVED::'}).ok,false);assert.equal(listed(p,r).reservationVersion,undefined);
 assert.equal(p.publicApi('reservation',{...access(r),confirmed:true}).ok,false);p.setActor('tesouraria@example.test');for(const confirmed of ['true',1,null])assert.equal(set(p,r,confirmed).ok,false);
 value(p.adminApi('cancel',{id:r.id,cancelled:true,note:'Cancelamento solicitado'}));assert.equal(set(p,r,true).ok,false);assert.equal(lookup(p,r).reservationStatus,'CANCELLED');
});
test('versão, repetição e replay preservam a decisão mais recente e a auditoria',()=>{
 const p=platform(),r=value(p.publicApi('create',registration())),version=listed(p,r).reservationVersion;
 const envelope=p.signed('reservation',{id:r.id,confirmed:true,version});value(p.bridge(envelope));value(p.bridge(envelope));assert.equal(listed(p,r).audit.length,1);
 assert.equal(set(p,r,false,{version}).ok,false);value(set(p,r,false));value(p.bridge(envelope));assert.equal(lookup(p,r).reservationStatus,'RESERVED');assert.equal(listed(p,r).audit.length,2);
 const count=listed(p,r).audit.length;value(set(p,r,false));assert.equal(listed(p,r).audit.length,count);const latest=listed(p,r).reservationVersion;p.lock(true);assert.equal(p.adminApi('reservation',{id:r.id,confirmed:true,version:latest}).ok,false);p.lock(false);
});
test('garantia manual após prazo respeita lotação; desmarcar libera a reserva expirada',()=>{
 const p=platform();p.properties.MAX_PARTICIPANTS='2';const a=value(p.publicApi('create',registration())),b=value(p.publicApi('create',registration()));p.setTime('2026-12-21T03:00:00Z');p.properties.MAX_PARTICIPANTS='1';
 value(set(p,b,true));assert.equal(value(p.publicApi('capacity')).remaining,0);assert.equal(set(p,a,true).ok,false);assert.equal(lookup(p,a).reservationStatus,'EXPIRED');
 value(set(p,b,false));assert.equal(lookup(p,b).reservationStatus,'EXPIRED');assert.equal(value(p.publicApi('capacity')).remaining,1);value(set(p,a,true));assert.equal(value(p.publicApi('capacity')).used,1);
});
