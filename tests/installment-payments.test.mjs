import test from 'node:test';
import assert from 'node:assert/strict';
import { platform,registration,proofFixture } from './platform.mjs';
const value=r=>{assert.equal(r.ok,true,r.error);return r.data;};const deny=(r,p)=>{assert.equal(r.ok,false);if(p)assert.match(r.error,p);};
const access=r=>({id:r.id,token:r.token});
const create=(p,plan='THRICE')=>value(p.publicApi('create',registration({plan,remindersEnabled:true,counts:{adultMembers:4,childMembers:0,spouse:0,adultGuests:0,childGuests:0}})));
const proof=(p,r,parts,data=proofFixture.data,method='PIX')=>p.publicApi('proof',{...access(r),parts,data,mime:'application/pdf',method});
const approve=(p,r,part,approved=true)=>{const file=value(p.adminApi('getProof',{id:r.id,part}));return p.adminApi('payment',{id:r.id,part,approved,proofVersion:file.version,note:'Comprovante e recebimento conferidos no teste'});};
const pdf=n=>Buffer.from('%PDF-1.4\nSynthetic receipt '+n+'\n%%EOF').toString('base64');
test('primeira parcela garante vagas; saldo continua pendente e entrada exige quitação',()=>{
 const p=platform({actor:'admin@example.test'}),r=create(p);
 assert.deepEqual(r.payment.parts.map(p=>p.amount),[10667,10667,10666]);assert.equal(r.paymentOptions[0].amount,10667);
 value(proof(p,r,[1]));value(approve(p,r,1));let current=value(p.publicApi('lookup',access(r)));
 assert.equal(current.reservationStatus,'CONFIRMED');assert.equal(current.paymentStatus,'PARTIALLY_PAID');assert.equal(current.payment.received,10667);assert.equal(current.payment.balance,21333);
 assert.equal(value(p.publicApi('capacity')).remaining,196);deny(p.adminApi('entry',{id:r.id}),/Pagamento pendente/);
 p.setTime('2026-12-21T03:00:00Z');assert.equal(value(p.publicApi('capacity')).remaining,196,'Primeira confirmada mantém garantia após o prazo');
 value(proof(p,r,[2,3],pdf(2),'DEPOSIT'));value(approve(p,r,2));current=value(p.publicApi('lookup',access(r)));
 assert.equal(current.paymentStatus,'PAID');assert.equal(current.payment.received,32000);assert.equal(current.payment.balance,0);assert.equal(current.payment.parts[2].method,'DEPOSIT');
 assert.ok(value(p.adminApi('entry',{id:r.id})).entryAt);assert.equal(value(p.adminApi('list')).metrics.receivedTotal,32000);
});
test('parcelas vencidas são somadas, recebem um comprovante e uma conferência conjunta',()=>{
 const p=platform({now:'2026-11-21T15:00:00Z'}),r=create(p);
 assert.deepEqual(r.paymentOptions[0].parts,[1,2]);assert.equal(r.paymentOptions[0].amount,21334);assert.match(r.paymentOptions[0].pix,/5406213\.34/);
 deny(proof(p,r,[1,3]),/cobradas juntas/);deny(proof(p,r,[1]),/cobradas juntas/);value(proof(p,r,[1,2]));value(proof(p,r,[1,2]));assert.equal(p.files.size,1,'retry não cria arquivo ou pagamento duplicado');
 const file=value(p.adminApi('getProof',{id:r.id,part:1}));const envelope=p.signed('payment',{id:r.id,part:1,approved:true,proofVersion:file.version,note:'Pagamento conjunto verificado'});value(p.bridge(envelope));value(p.bridge(envelope));
 const list=value(p.adminApi('list'));assert.equal(list.metrics.receivedTotal,21334);assert.equal(list.rows[0].payment.parts[1].status,'PAID');assert.equal(list.rows[0].payment.parts[2].status,'PENDING');
 deny(proof(p,r,[3]),/já foi usado/);value(proof(p,r,[3],pdf(3)));assert.equal(p.files.size,2);
});
test('pagar parcela futura antes da primeira não garante vaga e não duplica recebimentos',()=>{
 const p=platform(),r=create(p);value(proof(p,r,[3]));value(approve(p,r,3));
 assert.equal(value(p.publicApi('lookup',access(r))).reservationStatus,'RESERVED');p.setTime('2026-12-21T03:00:00Z');
 assert.equal(value(p.publicApi('lookup',access(r))).reservationStatus,'EXPIRED');assert.equal(value(p.publicApi('capacity')).remaining,200);
 assert.equal(value(p.adminApi('list')).metrics.receivedTotal,10666);
});
test('plano só muda antes de qualquer comprovante; preço e datas vêm do servidor',()=>{
 const p=platform(),r=create(p,'ONCE');let changed=value(p.publicApi('paymentPlan',{...access(r),plan:'TWICE',total:1,parts:[{amount:1}]}));
 assert.equal(changed.total,32000);assert.deepEqual(changed.payment.parts.map(p=>p.amount),[16000,16000]);
 const grant=value(p.publicApi('status',{name:r.name,phone:r.phone})).registrations[0].paymentAccess;
 changed=value(p.publicApi('paymentPlan',{...grant,plan:'THRICE'}));assert.equal(changed.name,undefined);assert.equal(changed.payment.parts.length,3);
 value(proof(p,r,[1]));deny(p.publicApi('paymentPlan',{...access(r),plan:'ONCE'}),/depois do envio/);deny(p.adminApi('getProof',{id:r.id}),/Escolha a parcela/);
 deny(p.publicApi('proof',{...access(r),...proofFixture,parts:[1,1]}),/válidas/);
});
test('reminders são privados, só com autorização e vencimento amanhã; abrir WhatsApp não comprova envio',()=>{
 const p=platform({now:'2026-10-24T15:00:00Z'}),r=create(p);let list=value(p.adminApi('list'));
 assert.equal(list.reminders.length,1);assert.equal(list.reminders[0].dueDate,'2026-10-25');assert.equal(list.reminders[0].amount,10667);
 const text=new URL(list.reminders[0].url).searchParams.get('text');assert.match(text,/vence amanhã/);assert.ok(!text.includes(r.token));assert.match(text,/não repita/);
 value(p.adminApi('reminderOpened',{id:r.id,part:1}));value(p.adminApi('reminderOpened',{id:r.id,part:1}));list=value(p.adminApi('list'));assert.ok(list.reminders[0].openedAt);assert.equal(list.rows[0].audit.filter(a=>a.action==='REMINDER_OPENED').length,1);
 p.setActor('entrada@example.test');assert.deepEqual(value(p.adminApi('list')).reminders,[]);deny(p.adminApi('reminderOpened',{id:r.id,part:1}),/não autorizado/);
 p.setActor('tesouraria@example.test');const grant=value(p.publicApi('status',{name:r.name,phone:r.phone})).registrations[0].paymentAccess;
 value(p.publicApi('reminderPreference',{...grant,enabled:false}));assert.equal(value(p.adminApi('list')).reminders.length,0);deny(p.publicApi('reminderPreference',{...grant,enabled:true}),/acesso completo/);
 value(p.publicApi('reminderPreference',{...access(r),enabled:true}));value(proof(p,r,[1]));assert.equal(value(p.adminApi('list')).reminders.length,0,'não cobrar parcela com comprovante em conferência');
});
test('migração de 22 colunas preserva cadastro, pagamento antigo, comprovante e tokens',()=>{
 const p=platform(),r=value(p.publicApi('create',registration()));const sheet=p.sheets.get('Inscricoes');
 sheet.rows[0]=sheet.rows[0].slice(0,22);sheet.rows[1]=sheet.rows[1].slice(0,22);const before=JSON.stringify(sheet.rows[1]);p.public.initializePublic_();
 assert.equal(sheet.rows[0][22],'paymentPlan');assert.equal(JSON.stringify(sheet.rows[1].slice(0,22)),before);
 const current=value(p.publicApi('lookup',access(r)));assert.equal(current.payment.plan,'LEGACY');assert.equal(current.payment.parts[0].amount,r.total);assert.equal(current.payment.parts[0].dueDate,'2026-12-20');
});

test('retry de cadastro anterior à atualização conserva inscrição original mesmo com opção nova no cliente',()=>{
 const p=platform(),input=registration(),old=value(p.publicApi('create',input));
 const again=value(p.publicApi('create',{...input,plan:'ONCE',remindersEnabled:true}));assert.equal(again.id,old.id);assert.equal(again.payment.plan,'LEGACY');assert.equal(again.remindersEnabled,false);assert.equal(value(p.adminApi('list')).rows.length,1);
});

test('configuração prorroga à vista pendente para 20/12 sem apagar comprovante nem alterar parcelas ou pagamentos conferidos',()=>{
 const p=platform(),pending=create(p,'ONCE'),paid=create(p,'ONCE'),split=create(p,'THRICE');
 value(proof(p,pending,[1]));value(proof(p,paid,[1]));value(approve(p,paid,1));
 const sheet=p.sheets.get('Inscricoes');
 for(const id of [pending.id,paid.id]){const cells=sheet.rows.find(r=>r[0]===id),plan=JSON.parse(cells[22]);plan.parts[0].dueDate='2026-10-25';cells[22]=JSON.stringify(plan);}
 const before=JSON.stringify(sheet.rows.find(r=>r[0]===pending.id).slice(0,17));
 p.public.console={log(){}};p.public.prepararPublicacao_();
 const current=value(p.publicApi('lookup',access(pending)));assert.equal(current.payment.parts[0].dueDate,'2026-12-20');assert.equal(current.paymentStatus,'PROOF_SUBMITTED');
 assert.equal(JSON.stringify(sheet.rows.find(r=>r[0]===pending.id).slice(0,17)),before);assert.equal(p.files.size,2);
 assert.equal(value(p.publicApi('lookup',access(paid))).payment.parts[0].dueDate,'2026-10-25');
 assert.equal(value(p.publicApi('lookup',access(split))).payment.parts[0].dueDate,'2026-10-25');
 const after=JSON.stringify(sheet.rows);p.public.prepararPublicacao_();assert.equal(JSON.stringify(sheet.rows),after);
});
