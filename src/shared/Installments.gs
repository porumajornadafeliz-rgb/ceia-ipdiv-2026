/** Calendário e valores de parcelas. Sem crédito bancário ou envio de mensagens. */
var PAYMENT_PLANS_ = Object.freeze([
  { key: 'ONCE', label: 'À vista', dates: ['2026-12-20'] },
  { key: 'TWICE', label: '2 vezes', dates: ['2026-11-20', '2026-12-20'] },
  { key: 'THRICE', label: '3 vezes', dates: ['2026-10-25', '2026-11-20', '2026-12-20'] }
]);
function brasiliaDay_(now) { return new Date(new Date(now === undefined ? Date.now() : now).getTime() - 3 * 3600000).toISOString().slice(0, 10); }
function dueLabel_(date) { return date.slice(8, 10) + '/' + date.slice(5, 7) + '/' + date.slice(0, 4); }
function splitCents_(total, count) {
  if (!Number.isSafeInteger(total) || total <= 0 || !Number.isInteger(count) || count < 1 || count > 3 || total < count) fail_('Valor ou número de parcelas inválido.');
  var base = Math.floor(total / count), remainder = total % count;
  return Array.from({ length: count }, function(_, i) { return base + (i < remainder ? 1 : 0); });
}
function scheduleFor_(total, key) {
  var plan = PAYMENT_PLANS_.find(function(p) { return p.key === key; });
  if (!plan) fail_('Escolha à vista, 2 vezes ou 3 vezes.');
  var amounts = splitCents_(total, plan.dates.length);
  return { key: plan.key, label: plan.label, parts: plan.dates.map(function(date, i) { return { number: i + 1, dueDate: date, amount: amounts[i], status: 'PENDING' }; }) };
}
function availableSchedules_(total, now, latePolicy) {
  if (['FUTURE_ONLY', 'COLLECT_OVERDUE'].indexOf(latePolicy) < 0) fail_('A regra para parcelas vencidas precisa ser definida pela organização.');
  var day = brasiliaDay_(now);
  return PAYMENT_PLANS_.map(function(plan) { return scheduleFor_(total, plan.key); }).filter(function(plan) {
    return latePolicy === 'COLLECT_OVERDUE' || plan.parts.every(function(part) { return part.dueDate >= day; });
  });
}
function partState_(part) { return part.paidAt || part.status === 'PAID' ? 'PAID' : part.proofId && part.status !== 'PROOF_REJECTED' ? 'PROOF_SUBMITTED' : 'PENDING'; }
function paymentParts_(row) {
  if (row.paymentPlan && Array.isArray(row.paymentPlan.parts)) return row.paymentPlan.parts;
  // Registros anteriores conservam valor, datas, comprovante e situação já existentes.
  return [{ number: 1, dueDate: '2026-12-20', amount: row.total, status: row.status,
    proofId: row.proofId || '', proofMime: row.proofMime || '', proofAt: row.proofAt || '',
    paidAt: row.paidAt || '', paidBy: row.paidBy || '', method: row.proofId ? 'PIX' : '' }];
}
function ensurePaymentPlan_(row) {
  if (!row.paymentPlan) row.paymentPlan = { key: 'LEGACY', label: 'Pagamento integral', parts: paymentParts_(row) };
  return row.paymentPlan;
}
function partFor_(row, number) {
  var parts = paymentParts_(row);
  if (number === undefined && parts.length === 1) return parts[0];
  if (!Number.isInteger(number)) fail_('Escolha a parcela que deseja pagar ou conferir.');
  var part = parts.find(function(p) { return p.number === number; });
  if (!part) fail_('Parcela não encontrada nesta inscrição.');
  return part;
}
function paymentTotals_(row) {
  var parts = paymentParts_(row), received = parts.reduce(function(sum, part) { return sum + (partState_(part) === 'PAID' ? part.amount : 0); }, 0);
  return { received: received, balance: row.total - received, paidParts: parts.filter(function(p) { return partState_(p) === 'PAID'; }).length, count: parts.length };
}
function publicPart_(part) {
  return { number: part.number, dueDate: part.dueDate, amount: part.amount, status: partState_(part),
    method: part.method || '', proofGroup: part.proofGroup || [part.number], proofSubmittedAt: part.proofAt || '', proofRejected: part.status === 'PROOF_REJECTED', paidAt: part.paidAt || '' };
}
function paymentOverview_(row) {
  var totals = paymentTotals_(row);
  return { plan: row.paymentPlan ? row.paymentPlan.key : 'LEGACY', planLabel: row.paymentPlan ? row.paymentPlan.label : 'Pagamento integral',
    received: totals.received, balance: totals.balance, parts: paymentParts_(row).map(publicPart_) };
}
function nextCivilDay_(day) { return new Date(Date.parse(day + 'T12:00:00Z') + 86400000).toISOString().slice(0, 10); }
/** Fila de lembretes; só a área financeira poderá expor estes contatos. Não envia mensagens. */
function reminderCandidates_(rows, now) {
  var day = nextCivilDay_(brasiliaDay_(now)), candidates = [];
  rows.forEach(function(row) {
    if (row.cancelledAt || reservationState_(row) === 'EXPIRED') return;
    var parts = paymentParts_(row);
    parts.forEach(function(part) {
      if (part.dueDate !== day || partState_(part) !== 'PENDING') return;
      candidates.push({ key: row.id + ':' + part.number + ':' + day, id: row.id, name: row.name, phone: row.phone,
        number: part.number, count: parts.length, amount: part.amount, dueDate: part.dueDate, proofRejected: part.status === 'PROOF_REJECTED' });
    });
  });
  return candidates;
}

function syncPayment_(row) {
  var parts = paymentParts_(row), totals = paymentTotals_(row);
  row.paidAt = totals.balance === 0 ? parts.map(function(p) { return p.paidAt || ''; }).sort().slice(-1)[0] : '';
  row.paidBy = row.paidAt ? parts.find(function(p) { return p.paidAt === row.paidAt; }).paidBy : '';
  var proofs = parts.filter(function(p) { return p.proofId; }).sort(function(a,b) { return (a.proofAt || '').localeCompare(b.proofAt || ''); });
  var latest = proofs.length ? proofs[proofs.length-1] : null;
  row.proofId = latest ? latest.proofId : ''; row.proofMime = latest ? latest.proofMime : ''; row.proofAt = latest ? latest.proofAt : '';
  row.status = totals.balance === 0 ? 'PAID' : parts.some(function(p) { return partState_(p) === 'PROOF_SUBMITTED'; }) ? 'PROOF_SUBMITTED' : totals.received > 0 ? 'PARTIALLY_PAID' : parts.some(function(p) { return p.status === 'PROOF_REJECTED'; }) ? 'PROOF_REJECTED' : 'REGISTERED';
}
function paymentOpen_(row) { return !row.cancelledAt && reservationState_(row) !== 'EXPIRED' && paymentTotals_(row).balance > 0; }
function assertPlanChange_(row) {
  if (!paymentOpen_(row)) fail_('Não é possível alterar o plano desta inscrição.');
  if (paymentParts_(row).some(function(p) { return p.proofId || partState_(p) === 'PAID'; })) fail_('O plano não pode mudar depois do envio de comprovante. Procure a secretaria.');
}
function chosenSchedule_(total, key, now) {
  var schedule = availableSchedules_(total, now, EVENT_.paymentPolicy.late).find(function(p) { return p.key === key; });
  if (!schedule) fail_('Condição de pagamento indisponível.');
  schedule.chosenAt = new Date(now === undefined ? Date.now() : now).toISOString();
  return schedule;
}
function payableGroups_(row, now) {
  if (!paymentOpen_(row)) return [];
  var pending = paymentParts_(row).filter(function(p) { return partState_(p) === 'PENDING'; });
  var day = brasiliaDay_(now), overdue = pending.filter(function(p) { return p.dueDate <= day; });
  var groups = [];
  if (overdue.length) groups.push(overdue.map(function(p) { return p.number; }));
  pending.forEach(function(p) { if (p.dueDate > day) groups.push([p.number]); });
  return groups;
}
function proofTargets_(row, input) {
  var numbers = input.parts === undefined ? [partFor_(row, input.part).number] : input.parts;
  if (!Array.isArray(numbers) || numbers.length < 1 || numbers.length > 3 || numbers.some(function(n,i) { return !Number.isInteger(n) || numbers.indexOf(n) !== i; })) fail_('Escolha parcelas válidas para este pagamento.');
  numbers = numbers.slice().sort();
  var targets = numbers.map(function(n) { return partFor_(row,n); });
  if (!targets.every(function(p) { return p.proofId && p.proofId === targets[0].proofId && JSON.stringify(p.proofGroup || [p.number]) === JSON.stringify(numbers); }) && !payableGroups_(row).some(function(group) { return JSON.stringify(group) === JSON.stringify(numbers); })) fail_('O pagamento precisa corresponder às parcelas oferecidas. Parcelas vencidas ou que vencem hoje são cobradas juntas.');
  return targets;
}

function reminderMessage_(item, publicUrl) {
  var value = (item.amount/100).toFixed(2).replace('.',',');
  return 'Olá, '+item.name+'! Lembrete da Ceia IPDiv 2026: '+(item.count === 1 ? 'o pagamento à vista' : 'a parcela '+item.number+'/'+item.count)+', de R$ '+value+', vence amanhã, '+dueLabel_(item.dueDate)+'. Pagamento por Pix ou depósito na conta da igreja. Se já pagou, não repita o pagamento; envie o comprovante para conferência.'+(publicUrl ? '\nConsulte e envie o comprovante pelo site: '+publicUrl : '');
}
function remindersForAdmin_(rows,now,publicUrl) {
  return reminderCandidates_(rows,now).filter(function(item) { var row=rows.find(function(r) {return r.id===item.id;});return Boolean(row.paymentPlan && row.paymentPlan.remindersEnabled); }).map(function(item) {
    var row=rows.find(function(r) {return r.id===item.id;}), opened=row.audit.find(function(a) {return a.action==='REMINDER_OPENED' && a.key===item.key;});
    item.message=reminderMessage_(item,publicUrl);item.url='https://wa.me/55'+item.phone+'?text='+encodeURIComponent(item.message);item.openedAt=opened ? opened.at : '';return item;
  });
}
