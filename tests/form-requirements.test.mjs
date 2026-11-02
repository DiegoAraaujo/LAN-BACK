import test from 'node:test';
import assert from 'node:assert/strict';
process.env.DATABASE_URL = 'postgresql://test:test@127.0.0.1:1/test';
const { createProfessionalSchema, updateProfessionalSchema } =
  await import('../src/domain/professionals/professionalsSchema.ts');
const { CreateProfessional } =
  await import('../src/domain/professionals/services/CreateProfessional.ts');
const { UpdateProfessional } =
  await import('../src/domain/professionals/services/UpdateProfessional.ts');
const { Professional } = await import('../src/domain/professionals/ProfessionalEntity.ts');
const { entrySchema, paymentSchema, FinanceService } =
  await import('../src/domain/finance/FinanceService.ts');
const { prisma } = await import('../src/shared/database/prisma.ts');
const { createCustomerSchema, updateCustomerSchema } =
  await import('../src/domain/customers/customerSchema.ts');
const requestId = '123e4567-e89b-42d3-a456-426614174000';
const entry = {
  requestId,
  kind: 'INCOME',
  amount: 25,
  method: 'PIX',
  occurredAt: new Date().toISOString(),
};

test('professional requires a name; contacts and address may be omitted or cleared', () => {
  assert.equal(createProfessionalSchema.safeParse({ name: 'Ana' }).success, true);
  assert.equal(
    createProfessionalSchema.safeParse({ name: 'Ana', phone: '', address: '' }).success,
    true,
  );
  assert.equal(createProfessionalSchema.safeParse({ name: ' ', phone: '' }).success, false);
  assert.equal(createProfessionalSchema.safeParse({ name: 'Ana', phone: '123' }).success, false);
  assert.deepEqual(updateProfessionalSchema.parse({ name: 'Ana' }), { name: 'Ana' });
});

test('multiple professionals without a phone do not trigger duplicate-phone lookup', async () => {
  const service = new CreateProfessional(
    {
      findByPhone: () => {
        throw Error('empty phone lookup');
      },
      create: async (value) => value,
    },
    {},
  );
  for (const name of ['Ana', 'Bia']) {
    const saved = await service.execute({ userId: 'owner', name });
    assert.equal(saved.phone, '');
    assert.equal(saved.address, '');
  }
});

test('professional update clears optional fields, preserves omitted ones and still checks duplicate phones', async () => {
  const professional = new Professional({
    id: 'pro',
    userId: 'owner',
    name: 'Ana',
    address: 'Rua A',
    phone: '11999999999',
  });
  const service = new UpdateProfessional(
    {
      findById: async () => professional,
      update: async (value) => value,
      findByPhone: async () => ({ id: 'other' }),
    },
    {},
  );
  await service.execute({ id: 'pro', userId: 'owner', name: 'Bia' });
  assert.equal(professional.phone, '11999999999');
  await assert.rejects(() => service.execute({ id: 'pro', userId: 'owner', phone: '11888888888' }));
  await service.execute({ id: 'pro', userId: 'owner', phone: '', address: '' });
  assert.equal(professional.phone, '');
  assert.equal(professional.address, '');
});

test('customer contact details are optional and short names work on both create and edit', () => {
  assert.equal(createCustomerSchema.safeParse({ name: 'Lu' }).success, true);
  assert.equal(updateCustomerSchema.safeParse({ name: 'Lu', address: '' }).success, true);
});

test('financial descriptions are optional but amount, date and payment method are required', () => {
  assert.equal(entrySchema.safeParse(entry).success, true);
  assert.equal(entrySchema.safeParse({ ...entry, description: 'A' }).success, true);
  for (const patch of [{ amount: 0 }, { amount: -1 }, { occurredAt: '' }, { method: undefined }]) {
    assert.equal(entrySchema.safeParse({ ...entry, ...patch }).success, false);
  }
});

test('blank financial descriptions get a useful default without changing money amounts', async () => {
  prisma.$transaction = async (work) =>
    work({
      $executeRaw: async () => 1,
      customer: { findFirst: async () => ({ id: requestId }) },
      financeEntry: { findUnique: async () => null, create: async ({ data }) => data },
    });
  for (const kind of ['INCOME', 'EXPENSE', 'CREDIT', 'OPENING']) {
    const saved = await new FinanceService().create(
      'owner',
      entrySchema.parse({ ...entry, kind, description: ' ', customerId: requestId }),
    );
    assert.ok(saved.description.length > 0);
    assert.ok(saved.category.length > 0);
    assert.equal(saved.cashCents, kind === 'EXPENSE' ? -2500 : 2500);
    assert.equal(saved.creditCents, kind === 'CREDIT' ? 2500 : 0);
  }
});

test('credit alone pays an appointment without requiring an additional cash payment', () => {
  assert.equal(
    paymentSchema.safeParse({
      requestId,
      payments: [],
      useCredit: 25,
      excess: 'CHANGE',
      occurredAt: entry.occurredAt,
    }).success,
    true,
  );
  assert.equal(
    paymentSchema.safeParse({
      requestId,
      payments: [],
      useCredit: 0,
      excess: 'CHANGE',
      occurredAt: entry.occurredAt,
    }).success,
    false,
  );
});
