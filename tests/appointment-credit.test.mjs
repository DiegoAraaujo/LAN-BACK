import test from 'node:test';
import assert from 'node:assert/strict';
process.env.DATABASE_URL = 'postgresql://test:test@127.0.0.1:1/test';
const { prisma } = await import('../src/shared/database/prisma.ts');
const { AppointmentsRepository } =
  await import('../src/domain/appointments/AppointmentsRepository.ts');
const { Appointment } = await import('../src/domain/appointments/AppointmentsEntity.ts');
const { createAppointmentBodySchema, updateAppointmentBodySchema } =
  await import('../src/domain/appointments/appointmentsSchema.ts');
const { paymentSchema, FinanceService } = await import('../src/domain/finance/FinanceService.ts');
const requestId = '123e4567-e89b-42d3-a456-426614174000';
const makePayment = (credit, cash = 0) =>
  paymentSchema.parse({
    requestId,
    payments: cash ? [{ amount: cash, method: 'PIX' }] : [],
    useCredit: credit,
    excess: 'CHANGE',
    occurredAt: new Date().toISOString(),
  });
function setup(balance = 10000, creditOwner = 'owner') {
  let state = {
    appointments: [],
    entries: [
      {
        id: 'advance',
        userId: creditOwner,
        customerId: 'customer',
        status: 'POSTED',
        creditCents: balance,
        cashCents: balance,
        appliedCents: 0,
      },
    ],
  };
  const matches = (row, where) =>
    Object.entries(where).every(([key, value]) => (key === 'reversal' ? true : row[key] === value));
  prisma.$transaction = async (work) => {
    const draft = structuredClone(state);
    const tx = {
      $executeRaw: async () => {},
      customer: {
        findFirst: async ({ where }) =>
          where.id === 'customer' && where.userId === 'owner' ? { id: 'customer' } : null,
      },
      appointment: {
        create: async ({ data }) => {
          const row = {
            ...data,
            id: 'appointment-' + draft.appointments.length,
            paidAmount: 0,
            deletedAt: null,
          };
          draft.appointments.push(row);
          return row;
        },
        findFirst: async ({ where }) =>
          draft.appointments.find((row) => matches(row, where)) ?? null,
        update: async ({ where, data }) => {
          const row = draft.appointments.find((row) => row.id === where.id);
          Object.assign(row, data);
          return row;
        },
      },
      financeEntry: {
        findUnique: async ({ where }) =>
          draft.entries.find((row) => matches(row, where.userId_requestId)) ?? null,
        create: async ({ data }) => {
          const row = { status: 'POSTED', id: 'entry-' + draft.entries.length, ...data };
          draft.entries.push(row);
          return row;
        },
        aggregate: async ({ where, _sum }) => ({
          _sum: Object.fromEntries(
            Object.keys(_sum).map((key) => [
              key,
              draft.entries
                .filter((row) => matches(row, where))
                .reduce((sum, row) => sum + (row[key] ?? 0), 0),
            ]),
          ),
        }),
        findFirst: async ({ where }) =>
          draft.entries.filter((row) => matches(row, where)).at(-1) ?? null,
      },
    };
    const result = await work(tx);
    state = draft;
    return result;
  };
  return () => state;
}
const appointment = (status = 'PENDING') =>
  new Appointment({
    userId: 'owner',
    customerId: 'customer',
    registeredById: 'owner',
    appointmentDate: new Date(),
    subtotal: 100,
    discount: 0,
    total: 100,
    paymentStatus: status,
    paymentMethod: status === 'PAID' ? 'PIX' : null,
  });
const create = (payment, status) =>
  new AppointmentsRepository().create(appointment(status), [], payment);

test('appointment can be created fully paid by credit without cash inflow', async () => {
  const state = setup();
  const saved = await create(makePayment(100));
  assert.equal(saved.paymentStatus, 'PAID');
  assert.equal(saved.paidAmount, 100);
  const payments = state().entries.filter((row) => row.kind === 'PAYMENT');
  assert.equal(payments.length, 1);
  assert.equal(payments[0].cashCents, 0);
  assert.equal(payments[0].creditCents, -10000);
});
test('credit and cash pay only the remainder with no duplicate cash entry', async () => {
  const state = setup(4000);
  const saved = await create(makePayment(40, 60));
  assert.equal(saved.paymentStatus, 'PAID');
  assert.equal(saved.paidAmount, 100);
  const payments = state().entries.filter((row) => row.kind === 'PAYMENT');
  assert.equal(
    payments.reduce((sum, row) => sum + row.cashCents, 0),
    6000,
  );
  assert.equal(
    payments.reduce((sum, row) => sum + row.creditCents, 0),
    -4000,
  );
});
test('partial credit leaves only the unpaid remainder open', async () => {
  setup(4000);
  const saved = await create(makePayment(40));
  assert.equal(saved.paymentStatus, 'PARTIAL');
  assert.equal(saved.paidAmount, 40);
});
test('insufficient credit rolls back the entire appointment and payment', async () => {
  const state = setup(1000);
  await assert.rejects(() => create(makePayment(100)));
  assert.equal(state().appointments.length, 0);
  assert.equal(state().entries.length, 1);
});
test('credit from another account cannot pay this appointment', async () => {
  const state = setup(10000, 'other-owner');
  await assert.rejects(() => create(makePayment(100)));
  assert.equal(state().appointments.length, 0);
});
test('retry with the same payment request does not create or charge twice', async () => {
  const state = setup();
  const payment = makePayment(100);
  const first = await create(payment);
  const second = await create(payment);
  assert.equal(first.id, second.id);
  assert.equal(state().appointments.length, 1);
  assert.equal(state().entries.length, 2);
});
test('legacy simple and pending creation remain supported', async () => {
  const state = setup();
  await create(undefined, 'PAID');
  await create(undefined, 'PENDING');
  assert.equal(state().appointments.length, 2);
  assert.equal(state().entries.filter((row) => row.kind === 'PAYMENT').length, 1);
});
test('only creation accepts initial payment, and malformed payment is rejected', () => {
  const body = {
    customerId: requestId,
    appointmentDate: new Date().toISOString(),
    paymentStatus: 'PENDING',
    items: [{ serviceId: requestId, professionalId: requestId }],
    initialPayment: makePayment(100),
  };
  assert.equal(createAppointmentBodySchema.safeParse(body).success, true);
  assert.equal(
    createAppointmentBodySchema.safeParse({
      ...body,
      initialPayment: { ...body.initialPayment, useCredit: -1 },
    }).success,
    false,
  );
  assert.equal(
    updateAppointmentBodySchema.safeParse({ initialPayment: makePayment(100) }).success,
    false,
  );
});

test('existing appointments can still be paid by the standalone payment endpoint', async () => {
  const state = setup();
  const pending = await create(undefined, 'PENDING');
  await new FinanceService().pay('owner', pending.id, makePayment(100));
  assert.equal(state().appointments[0].paymentStatus, 'PAID');
  assert.equal(state().entries.filter((row) => row.kind === 'PAYMENT').length, 1);
});
