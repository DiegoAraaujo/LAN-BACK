import test from 'node:test';
import assert from 'node:assert/strict';
import { DashboardStats } from '../dist/domain/dashboard/DashboardService.js';
import { dashboardPeriod } from '../dist/domain/dashboard/dashboardPeriod.js';
import { createAppointmentBodySchema, updateAppointmentBodySchema } from '../dist/domain/appointments/appointmentsSchema.js';
import { UpdateAppointment } from '../dist/domain/appointments/services/UpdateAppointment.js';
const item = (name, value) => ({ serviceId: name, professionalId: name, serviceName: name, professionalName: name, value });
const row = (id, total, status = 'PAID', items = [item('Corte', total)], date = '2026-09-05T15:00:00Z') => ({
  id, customerId: 'customer-'+id, customerName: 'Cliente '+id, total, subtotal: items.reduce((s,i) => s+i.value,0),
  discount: items.reduce((s,i) => s+i.value,0)-total, appointmentDate: new Date(date), paymentStatus: status, paymentMethod: status === 'PAID' ? 'PIX' : null, items,
});
const calculate = (appointments, previousAppointments = [], month = 9) => new DashboardStats({
  getDashboardRawData: async () => ({ appointments, previousAppointments, newCustomers: 3 }),
}).execute({ userId: 'account-a', year: 2026, month });
test('paid + pending equals net total; average uses paid appointments only', async () => {
  const data = await calculate([row('1', 80, 'PAID', [item('Corte',100)]), row('2',50,'PENDING'), row('3',20)]);
  assert.equal(data.cards.totalRevenue,100); assert.equal(data.cards.pendingRevenue,50);
  assert.equal(data.cards.totalValue,150); assert.equal(data.cards.totalAppointments,3);
  assert.equal(data.cards.averageTicket,50); assert.equal(data.cards.paidCount,2); assert.equal(data.cards.pendingCount,1);
});
test('payment transition moves the amount without changing the period total', async () => {
  const before = await calculate([row('1',50,'PENDING')]);
  const after = await calculate([row('1',50,'PAID')]);
  assert.equal(before.cards.totalValue,after.cards.totalValue);
  assert.equal(after.cards.pendingRevenue,0); assert.equal(after.cards.totalRevenue,50);
});
test('discount allocation closes exactly to the cent in both rankings', async () => {
  const data = await calculate([row('1', 9.99, 'PAID',[item('A',5),item('B',5),item('C',5)])]);
  for (const ranking of [data.servicesPieGraph,data.professionals,data.paymentMethods]) {
    assert.equal(ranking.reduce((s,r) => s+Math.round(r.revenue*100),0),999);
  }
});
test('pending values do not count as received service or professional revenue', async () => {
  const data = await calculate([row('1',50,'PENDING')]);
  assert.equal(data.servicesPieGraph[0].count,1); assert.equal(data.servicesPieGraph[0].revenue,0);
  assert.equal(data.professionals[0].revenue,0); assert.deepEqual(data.paymentMethods,[]);
});
test('one appointment with multiple services counts once per professional', async () => {
  const a = row('1',30,'PAID',[item('A',10),{...item('B',20),professionalId:'A',professionalName:'A'}]);
  const data = await calculate([a]); assert.equal(data.professionals[0].count,1);
});
test('zero previous baseline has no fabricated growth percentage', async () => {
  const data = await calculate([row('1',50)]);
  assert.equal(data.comparison.revenue,null);
  const next = await calculate([row('1',100)],[row('old',50)]);
  assert.equal(next.comparison.revenue,100);
});
test('empty period returns zeros and daily buckets', async () => {
  const data = await calculate([]); assert.equal(data.cards.totalValue,0); assert.equal(data.cards.averageTicket,0);
  assert.equal(data.evolutionGraph.length,30); assert.deepEqual(data.pendingAppointments,[]);
});
test('business timezone and previous period work at year rollover', () => {
  const p = dashboardPeriod(2026,1);
  assert.equal(p.start.toISOString(),'2026-01-01T03:00:00.000Z');
  assert.equal(p.previousStart.toISOString(),'2025-12-01T03:00:00.000Z');
  assert.equal(p.end.toISOString(),'2026-02-01T03:00:00.000Z');
  const annual = dashboardPeriod(2026);
  assert.equal(annual.previousStart.toISOString(),'2025-01-01T03:00:00.000Z');
  assert.equal(annual.end.toISOString(),'2027-01-01T03:00:00.000Z');
});
test('graph buckets use São Paulo day, and annual report has 12 months', async () => {
  const a=row('1',50,'PAID',undefined,'2026-09-06T01:00:00Z');
  const daily=await calculate([a]); assert.equal(daily.evolutionGraph[4].revenue,50);
  const annual=await new DashboardStats({getDashboardRawData:async()=>({appointments:[a],previousAppointments:[],newCustomers:0})}).execute({userId:'a',year:2026});
  assert.equal(annual.evolutionGraph.length,12); assert.equal(annual.evolutionGraph[8].revenue,50);
});
test('API accepts debit/credit and rejects legacy CARD and invalid discounts', () => {
  const payload={customerId:'00000000-0000-4000-8000-000000000001',appointmentDate:'2026-09-05T15:00:00Z',paymentStatus:'PAID',items:[{serviceId:'00000000-0000-4000-8000-000000000002',professionalId:'00000000-0000-4000-8000-000000000003'}]};
  assert.equal(createAppointmentBodySchema.safeParse({...payload,paymentMethod:'DEBIT_CARD'}).success,true);
  assert.equal(createAppointmentBodySchema.safeParse({...payload,paymentMethod:'CREDIT_CARD'}).success,true);
  assert.equal(createAppointmentBodySchema.safeParse({...payload,paymentMethod:'CARD'}).success,false);
  assert.equal(createAppointmentBodySchema.safeParse({...payload,discount:-1}).success,false);
  assert.equal(createAppointmentBodySchema.safeParse({...payload,items:[]}).success,false);
  assert.equal(updateAppointmentBodySchema.safeParse({items:[]}).success,false);
});
test('changing services cannot leave a discount greater than the new subtotal', async () => {
  let persisted = false;
  const service = new UpdateAppointment(
    {findById:async()=>({subtotal:100,discount:80}),update:async()=>{persisted=true}},
    {findById:async()=>({price:50,name:'A'})},
    {findById:async()=>({name:'A'}),hasService:async()=>true}
  );
  await assert.rejects(()=>service.execute({id:'a',userId:'account',items:[{serviceId:'a',professionalId:'a'}]}), error=>error.code==='INVALID_DISCOUNT');
  assert.equal(persisted,false);
});
test('marking paid preserves the existing discount and net total', async () => {
  const patch = updateAppointmentBodySchema.parse({ paymentStatus: 'PAID', paymentMethod: 'CREDIT_CARD' });
  assert.equal(patch.discount, undefined);
  const appointment = { subtotal: 100, discount: 20, total: 80, paymentStatus: 'PENDING', paymentMethod: null };
  const service = new UpdateAppointment({ findById: async () => appointment, update: async a => a }, {}, {});
  const updated = await service.execute({ id: 'a', userId: 'account', ...patch });
  assert.equal(updated.discount, 20); assert.equal(updated.total, 80);
  assert.equal(updated.paymentStatus, 'PAID'); assert.equal(updated.paymentMethod, 'CREDIT_CARD');
});
test('historical summer-time periods use the actual São Paulo offset', () => {
  assert.equal(dashboardPeriod(2018, 1).start.toISOString(), '2018-01-01T02:00:00.000Z');
});
