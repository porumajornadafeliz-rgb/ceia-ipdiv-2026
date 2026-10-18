import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';
const context = vm.createContext({});
for (const file of ['Domain.gs','Installments.gs']) vm.runInContext(readFileSync(new URL('../src/shared/'+file,import.meta.url),'utf8'),context);
const copy=v=>JSON.parse(JSON.stringify(v));
test('parcelas usam valores inteiros, somam o total e têm as datas solicitadas',()=>{
 for (const total of [8000,32000,66000,999999]) for(const key of ['ONCE','TWICE','THRICE']) {
  const plan=copy(context.scheduleFor_(total,key)); assert.equal(plan.parts.reduce((sum,p)=>sum+p.amount,0),total);
  assert.ok(plan.parts.every(p=>Number.isSafeInteger(p.amount)));assert.ok(Math.max(...plan.parts.map(p=>p.amount))-Math.min(...plan.parts.map(p=>p.amount))<=1);
 }
 assert.deepEqual(copy(context.scheduleFor_(32000,'THRICE')).parts.map(p=>p.amount),[10667,10667,10666]);
 assert.deepEqual(copy(context.scheduleFor_(32000,'TWICE')).parts.map(p=>p.dueDate),['2026-11-20','2026-12-20']);
 assert.equal(context.scheduleFor_(8000,'ONCE').parts[0].dueDate,'2026-10-25');
 assert.throws(()=>context.scheduleFor_(8000,'FAKE'));assert.throws(()=>context.splitCents_(80.5,2));
});
test('comparação de datas usa Brasília e trata o dia inteiro do vencimento',()=>{
 assert.equal(context.brasiliaDay_('2026-10-26T02:59:59.999Z'),'2026-10-25');
 assert.equal(context.brasiliaDay_('2026-10-26T03:00:00Z'),'2026-10-26');
 assert.equal(context.availableSchedules_(8000,'2026-10-26T02:59:59Z','FUTURE_ONLY').length,3);
 assert.deepEqual(copy(context.availableSchedules_(8000,'2026-10-26T03:00:00Z','FUTURE_ONLY')).map(p=>p.key),['TWICE']);
 assert.equal(context.availableSchedules_(8000,'2026-11-21T03:00:00Z','FUTURE_ONLY').length,0);
 assert.equal(context.availableSchedules_(8000,'2026-11-21T03:00:00Z','COLLECT_OVERDUE').length,3);
 assert.throws(()=>context.availableSchedules_(8000,Date.now(),'UNDECIDED'));
});
test('registros existentes preservam valores, comprovantes e datas ao ganhar plano integral legado',()=>{
 const row={total:32000,status:'PROOF_SUBMITTED',proofId:'private-test-id',proofAt:'2026-10-17T12:00:00Z',proofMime:'application/pdf'};
 const plan=context.ensurePaymentPlan_(row);assert.equal(plan.key,'LEGACY');assert.equal(plan.parts[0].proofId,row.proofId);
 assert.equal(context.paymentTotals_(row).balance,32000);plan.parts[0].paidAt='2026-10-18T12:00:00Z';assert.equal(context.paymentTotals_(row).received,32000);
 const overview=JSON.stringify(context.paymentOverview_(row));assert.ok(!overview.includes('private-test-id'));assert.ok(!overview.includes('paidBy'));
});
test('totais reconhecem somente parcelas confirmadas e não aceitam índices ambíguos',()=>{
 const row={total:32000,paymentPlan:copy(context.scheduleFor_(32000,'THRICE'))};
 row.paymentPlan.parts[0].paidAt='2026-10-25T12:00:00Z';row.paymentPlan.parts[1].proofId='private-awaiting';
 assert.deepEqual(copy(context.paymentTotals_(row)),{received:10667,balance:21333,paidParts:1,count:3});
 assert.throws(()=>context.partFor_(row));assert.throws(()=>context.partFor_(row,'2'));assert.throws(()=>context.partFor_(row,9));
 assert.equal(context.partFor_(row,2).proofId,'private-awaiting');
 assert.equal(context.nextCivilDay_('2026-10-24'),'2026-10-25');assert.equal(context.nextCivilDay_('2026-12-31'),'2027-01-01');
});
test('lembrete seleciona a parcela de amanhã, sem cobrar pagas, canceladas ou comprovantes em conferência',()=>{
 const row={id:'TEST',name:'Família sintética',phone:'37999990000',total:32000,paymentPlan:copy(context.scheduleFor_(32000,'THRICE'))};
 const now='2026-11-19T18:00:00Z';
 let queue=copy(context.reminderCandidates_([row],now));assert.equal(queue.length,1);assert.equal(queue[0].number,2);assert.equal(queue[0].amount,10667);
 row.paymentPlan.parts[1].proofId='private-file';assert.equal(context.reminderCandidates_([row],now).length,0);
 row.paymentPlan.parts[1].status='PROOF_REJECTED';assert.equal(context.reminderCandidates_([row],now).length,1);
 row.paymentPlan.parts[1].paidAt='2026-11-18T18:00:00Z';assert.equal(context.reminderCandidates_([row],now).length,0);
 row.paymentPlan.parts[1].paidAt='';row.cancelledAt='2026-11-18T18:00:00Z';assert.equal(context.reminderCandidates_([row],now).length,0);
 row.cancelledAt='';assert.equal(context.reminderCandidates_([row],'2026-11-18T18:00:00Z').length,0);
});
