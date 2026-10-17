import test from 'node:test';
import assert from 'node:assert/strict';
import { platform, registration, proofFixture, pay, proofVersion } from './platform.mjs';
const value = r => { assert.equal(r.ok,true,r.error); return r.data; };
const denied = (r, pattern) => { assert.equal(r.ok,false); if(pattern) assert.match(r.error,pattern); };
const access = r => ({id:r.id,token:r.token});
const upload = (p,r,extra={}) => p.publicApi('proof',{...access(r),...proofFixture,...extra});
test('comprovante fica privado e pendente; somente secretaria autorizada confirma após conferir',()=>{
 const p=platform(),r=value(p.publicApi('create',registration()));
 assert.equal(r.paymentStatus,'PENDING'); assert.equal(r.reservationStatus,'RESERVED');
 const submitted=value(upload(p,r)); assert.equal(submitted.paymentStatus,'PROOF_SUBMITTED'); assert.equal(submitted.pix,'');
 assert.equal(submitted.proofId,undefined); assert.equal(p.files.size,1); assert.equal(value(p.publicApi('capacity')).remaining,199);
 const duplicate=value(upload(p,r)); assert.equal(duplicate.proofSubmittedAt,submitted.proofSubmittedAt); assert.equal(p.files.size,1);
 for(const action of ['payment','getProof']) { p.setActor('entrada@example.test'); denied(p.adminApi(action,{id:r.id,proofVersion:proofVersion(p,r),approved:true,note:'Tentativa'}),/não autorizado/); }
 p.setActor('tesouraria@example.test'); const proof=value(p.adminApi('getProof',{id:r.id})); assert.equal(proof.data,proofFixture.data);
 const paid=value(p.adminApi('payment',{id:r.id,proofVersion:proofVersion(p,r),approved:true,note:'Recebimento e comprovante conferidos'}));
 assert.equal(paid.paymentStatus,'PAID'); assert.equal(paid.reservationStatus,'CONFIRMED'); assert.equal(paid.paidBy,'tesouraria@example.test');
 assert.equal(value(p.adminApi('list')).metrics.receivedTotal,8000);
 assert.equal(value(p.publicApi('capacity')).remaining,199);
 const audit=paid.audit.length; assert.equal(value(p.adminApi('payment',{id:r.id,proofVersion:proofVersion(p,r),approved:true,note:'Repetição'})).audit.length,audit);
 denied(p.adminApi('payment',{id:r.id,proofVersion:proofVersion(p,r),approved:false,note:'Desfazer'}),/estorno/); denied(upload(p,r),/já confirmada/);
});
test('recusa mantém pendente, exige motivo e permite novo comprovante sem nova inscrição',()=>{
 const p=platform(),r=value(p.publicApi('create',registration())); value(upload(p,r));
 denied(p.adminApi('payment',{id:r.id,proofVersion:proofVersion(p,r),approved:false,note:''}));
 value(p.adminApi('payment',{id:r.id,proofVersion:proofVersion(p,r),approved:false,note:'Destinatário divergente'}));
 denied(p.adminApi('payment',{id:r.id,proofVersion:proofVersion(p,r),approved:true,note:'Tentar confirmar comprovante recusado'}), /recusado/);
 const pending=value(p.publicApi('lookup',access(r))); assert.equal(pending.paymentStatus,'PENDING'); assert.equal(pending.proofRejected,true); assert.ok(pending.pix);
 value(upload(p,r,{data:Buffer.from('%PDF-1.4\nSecond synthetic receipt\n%%EOF').toString('base64')}));
 assert.equal(p.files.size,2); value(p.adminApi('payment',{id:r.id,proofVersion:proofVersion(p,r),approved:true,note:'Novo comprovante conferido'}));
 assert.equal(value(p.adminApi('list')).rows.length,1);
});
test('acesso por nome e WhatsApp só permite pagamento, expira e não recupera token nem comprovante privado',()=>{
 const p=platform(),r=value(p.publicApi('create',registration()));
 const grant=value(p.publicApi('status',{name:r.name,phone:r.phone})).registrations[0].paymentAccess;
 const options=value(p.publicApi('paymentDetails',grant)); assert.equal(options.total,8000); assert.ok(options.pix);
 for(const key of ['token','name','phone','counts','audit','proofId']) assert.equal(options[key],undefined);
 denied(p.publicApi('lookup',{id:r.id,token:grant.grant})); denied(p.publicApi('report',grant));
 denied(p.publicApi('paymentDetails',{...grant,id:'IPD26AAAAAAAAAAAAAAAA'}));
 const uploaded=value(p.publicApi('proof',{...grant,...proofFixture})); assert.equal(uploaded.paymentStatus,'PROOF_SUBMITTED'); assert.equal(uploaded.name,undefined);
 p.setTime('2026-10-17T15:10:00Z'); denied(p.publicApi('paymentDetails',grant),/expirado/);
});
test('conteúdo, tipo, tamanho, token, pasta privada e bloqueio são verificados antes da gravação',()=>{
 const p=platform(),r=value(p.publicApi('create',registration()));
 for(const extra of [{mime:'text/html'},{data:Buffer.from('<script>bad</script>').toString('base64')},{data:'?'},{data:Buffer.alloc(2097153,42).toString('base64')},{token:'a'.repeat(43)}]) denied(upload(p,r,extra));
 p.shareFolder(true); denied(upload(p,r),/restrita/); p.shareFolder(false);
 p.lock(true); denied(upload(p,r),/Muitos acessos/); p.lock(false);
 assert.equal(p.files.size,0); assert.equal(value(p.publicApi('lookup',access(r))).paymentStatus,'PENDING');
 for(const [mime,bytes] of [['image/png',[137,80,78,71,13,10,26,10,0]],['image/jpeg',[255,216,255,0,0,0,0,0]]]) {
  const r2=value(p.publicApi('create',registration())); value(upload(p,r2,{mime,data:Buffer.from(bytes).toString('base64')}));
 }
});
test('prazo libera reservas não confirmadas automaticamente e preserva pagas, consultas e histórico',()=>{
 const p=platform(),paid=value(p.publicApi('create',registration())),pending=value(p.publicApi('create',registration())),proof=value(p.publicApi('create',registration()));
 pay(p,paid); value(upload(p,proof)); const before=JSON.stringify(p.sheets.get('Inscricoes').rows);
 assert.equal(value(p.publicApi('capacity')).remaining,197); p.setTime('2026-12-21T03:00:00Z');
 assert.equal(value(p.publicApi('capacity')).remaining,199); assert.equal(JSON.stringify(p.sheets.get('Inscricoes').rows),before);
 assert.equal(value(p.publicApi('lookup',access(pending))).reservationStatus,'EXPIRED');
 denied(upload(p,pending),/expirada/); assert.equal(value(p.adminApi('list')).metrics.expiredFamilies,2);
 assert.equal(value(p.publicApi('lookup',access(paid))).reservationStatus,'CONFIRMED');
});
test('confirmação tardia disputa vagas com bloqueio, não confirma família acima do saldo e replay não duplica',()=>{
 const p=platform(); p.properties.MAX_PARTICIPANTS='2';
 const rows=[value(p.publicApi('create',registration())),value(p.publicApi('create',registration()))]; rows.forEach(r=>value(upload(p,r)));
 p.setTime('2026-12-21T03:00:00Z'); p.properties.MAX_PARTICIPANTS='1';
 p.lock(true); denied(p.adminApi('payment',{id:rows[0].id,proofVersion:proofVersion(p,rows[0]),approved:true,note:'Conferido'}),/Muitos acessos/); p.lock(false);
 const envelope=p.signed('payment',{id:rows[0].id,proofVersion:proofVersion(p,rows[0]),approved:true,note:'Conferido'}); value(p.bridge(envelope)); value(p.bridge(envelope));
 denied(p.adminApi('payment',{id:rows[1].id,proofVersion:proofVersion(p,rows[1]),approved:true,note:'Conferido'}),/esgotadas/);
 assert.equal(value(p.publicApi('capacity')).used,1); assert.equal(value(p.adminApi('list')).metrics.receivedTotal,8000);
});
test('cancelamento mantém auditoria financeira e não transforma cancelamento em devolução',()=>{
 const p=platform(),r=value(p.publicApi('create',registration())); pay(p,r);
 value(p.adminApi('cancel',{id:r.id,cancelled:true,note:'Solicitação do responsável'}));
 assert.equal(value(p.publicApi('capacity')).remaining,200); assert.equal(value(p.adminApi('list')).metrics.receivedTotal,8000);
 denied(p.adminApi('payment',{id:r.id,proofVersion:proofVersion(p,r),approved:true,note:'Conferido'}),/cancelada/);
});

test('conferência recusa comprovante substituído depois do download',()=>{
 const p=platform(),r=value(p.publicApi('create',registration()));value(upload(p,r));
 const old=proofVersion(p,r);value(p.adminApi('payment',{id:r.id,approved:false,proofVersion:old,note:'Comprovante divergente'}));
 value(upload(p,r,{data:Buffer.from('%PDF-1.4\nNew test receipt\n%%EOF').toString('base64')}));
 denied(p.adminApi('payment',{id:r.id,approved:true,proofVersion:old,note:'Arquivo antigo conferido'}),/comprovante mudou/);
 assert.equal(value(p.publicApi('lookup',access(r))).paymentStatus,'PROOF_SUBMITTED');
});
