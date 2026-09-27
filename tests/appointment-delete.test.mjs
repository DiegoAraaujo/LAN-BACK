import test from 'node:test';
import assert from 'node:assert/strict';

process.env.DATABASE_URL = 'postgresql://test:test@127.0.0.1:1/test';
const { prisma } = await import('../dist/shared/database/prisma.js');
const { AppointmentsRepository } = await import('../dist/domain/appointments/AppointmentsRepository.js');
const { RemoveAppointment } = await import('../dist/domain/appointments/services/RemoveAppointment.js');
const { searchAppointments, searchSchema } = await import('../dist/domain/finance/appointmentSearch.js');

function setup(entries, failDelete = false) {
  const appointment = { id: 'appointment', userId: 'owner', customerId: 'customer' };
  let state = { appointment, entries: structuredClone(entries) };
  prisma.appointment.findUnique = async () => state.appointment;
  prisma.$transaction = async work => {
    const draft = structuredClone(state);
    const matches = (entry, where) => Object.entries(where).every(([key, value]) =>
      key === 'reversalOfId' ? entry.reversalOfId != null : entry[key] === value);
    const tx = {
      $executeRaw: async () => {},
      appointment: {
        findFirst: async ({ where }) => draft.appointment && matches(draft.appointment, where) ? draft.appointment : null,
        delete: async () => {
          if (failDelete) throw new Error('delete failed');
          assert.equal(draft.entries.some(e => e.appointmentId === appointment.id), false);
          draft.appointment = null;
        },
      },
      financeEntry: {
        aggregate: async ({ where }) => ({ _sum: { creditCents: draft.entries.filter(e => matches(e, where)).reduce((sum, e) => sum + e.creditCents, 0) } }),
        updateMany: async ({ where, data }) => { draft.entries.filter(e => matches(e, where)).forEach(e => Object.assign(e, data)); },
        deleteMany: async ({ where }) => {
          const removed = draft.entries.filter(e => matches(e, where));
          assert.equal(draft.entries.some(e => removed.some(r => r.id === e.reversalOfId)), false);
          draft.entries = draft.entries.filter(e => !matches(e, where));
        },
      },
    };
    const result = await work(tx);
    state = draft;
    return result;
  };
  return () => state;
}

const entry = (id, overrides = {}) => ({ id, userId: 'owner', customerId: 'customer', appointmentId: 'appointment', status: 'POSTED', cashCents: 5000, creditCents: 0, ...overrides });

test('permanently removes pending, paid, split-paid and reversed appointments; preserves unrelated entries', async () => {
  for (const payments of [[], [entry('paid')], [entry('pix'), entry('cash')], [entry('paid'), entry('refund', { reversalOfId: 'paid', cashCents: -5000 })]]) {
    const unrelated = entry('unrelated', { appointmentId: 'other' });
    const state = setup([...payments, unrelated]);
    await new AppointmentsRepository().delete('appointment');
    assert.equal(state().appointment, null);
    assert.deepEqual(state().entries, [unrelated]);
  }
});

test('restores consumed customer credit by removing its application', async () => {
  const deposit = entry('deposit', { appointmentId: null, creditCents: 5000 });
  const state = setup([deposit, entry('credit-use', { cashCents: 0, creditCents: -5000 })]);
  await new AppointmentsRepository().delete('appointment');
  assert.equal(state().entries.reduce((sum, e) => sum + e.creditCents, 0), 5000);
});

test('removes unused generated credit but blocks deletion when another appointment spent it', async () => {
  const generated = entry('surplus', { creditCents: 1000 });
  const unused = setup([generated]);
  await new AppointmentsRepository().delete('appointment');
  assert.deepEqual(unused().entries, []);
  const state = setup([generated, entry('spent', { appointmentId: 'other', creditCents: -1000 })]);
  await assert.rejects(() => new AppointmentsRepository().delete('appointment'), { code: 'PAYMENT_CONFLICT' });
  assert.ok(state().appointment);
  assert.equal(state().entries.length, 2);
});

test('rolls back financial removal when deleting the appointment fails', async () => {
  const payment = entry('paid');
  const state = setup([payment], true);
  await assert.rejects(() => new AppointmentsRepository().delete('appointment'), /delete failed/);
  assert.deepEqual(state().entries, [payment]);
  assert.ok(state().appointment);
});

test('refuses deletion when the appointment does not belong to the requesting user', async () => {
  let deleted = false;
  const service = new RemoveAppointment({ findById: async () => null, delete: async () => { deleted = true; } });
  await assert.rejects(() => service.execute({ id: 'appointment', userId: 'other' }), { code: 'APPOINTMENT_NOT_FOUND' });
  assert.equal(deleted, false);
});

test('lists every distinct active payment method and customer credit without exposing ledger entries', async () => {
  prisma.$transaction = async work => work({ appointment: {
    findMany: async ({ include }) => {
      assert.deepEqual(include.financeEntries.where, { kind: 'PAYMENT', status: 'POSTED', reversal: null });
      return [{ customer: { name: 'Ana' }, total: 50, subtotal: 50, discount: 0, paidAmount: 50, items: [],
        financeEntries: [{ method: 'PIX', creditCents: 0 }, { method: 'CASH', creditCents: 0 }, { method: 'PIX', creditCents: 0 }, { method: null, creditCents: -1000 }] }];
    },
    count: async () => 1,
    aggregate: async () => ({ _sum: { total: 50, paidAmount: 50 } }),
  } });
  const result = await searchAppointments('owner', searchSchema.parse({}));
  assert.deepEqual(result.data[0].paymentMethods, ['PIX', 'CASH']);
  assert.equal(result.data[0].usesCredit, true);
  assert.equal(Object.hasOwn(result.data[0], 'financeEntries'), false);
});
