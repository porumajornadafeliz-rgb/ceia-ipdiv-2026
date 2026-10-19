import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {platform,registration} from './platform.mjs';
const v=r=>{assert.equal(r.ok,true,r.error);return r.data;};
const source=readFileSync(new URL('../src/admin/AdminClient.html',import.meta.url),'utf8');
const helpers=source.slice(source.indexOf('function reservationMetrics('),source.indexOf('async function changeReservation('));
test('indicadores locais após marcar/desmarcar coincidem com o servidor, inclusive ao garantir uma reserva expirada',()=>{
 const p=platform(),r=v(p.publicApi('create',registration({plan:'TWICE'})));p.setTime('2026-12-21T03:00:00Z');
 const state=v(p.adminApi('list')),ctx=vm.createContext({state,renderMetrics(){},renderTable(){}});vm.runInContext(helpers,ctx);
 for(const confirmed of [true,false,true]){
  const current=ctx.state.rows[0],updated=v(p.adminApi('reservation',{id:r.id,confirmed,version:current.reservationVersion}));
  ctx.updated=updated;vm.runInContext('applyReservationUpdate(updated)',ctx);
  const expected=v(p.adminApi('list'));assert.deepEqual(JSON.parse(JSON.stringify(ctx.state.metrics)),expected.metrics);assert.deepEqual(JSON.parse(JSON.stringify(ctx.state.capacity)),expected.capacity);
 }
});
