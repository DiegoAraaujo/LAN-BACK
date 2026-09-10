import test from 'node:test';
import assert from 'node:assert/strict';

// Never use the configured application database in these tests.
process.env.DATABASE_URL = 'postgresql://test:test@127.0.0.1:1/test';
const { createCustomerSchema, updateCustomerSchema, customerStatusSchema } = await import('../dist/domain/customers/customerSchema.js');
const { Customer } = await import('../dist/domain/customers/CustomerEntity.js');
const { UpdateCustomer } = await import('../dist/domain/customers/services/UpdateCustomer.js');
const { ListCustomers } = await import('../dist/domain/customers/services/ListCustomers.js');
const { prisma } = await import('../dist/shared/database/prisma.js');
const { default: CustomersRepository } = await import('../dist/domain/customers/CustomersRepository.js');

test('accepts all three statuses, keeps ACTIVE as default and rejects unknown statuses', () => {
  assert.equal(createCustomerSchema.parse({ name: 'Ana' }).status, 'ACTIVE');
  for (const status of ['ACTIVE', 'INACTIVE', 'OCCASIONAL']) {
    assert.equal(createCustomerSchema.parse({ name: 'Ana', status }).status, status);
    assert.equal(updateCustomerSchema.parse({ status }).status, status);
    assert.equal(customerStatusSchema.parse(status), status);
  }
  assert.equal(updateCustomerSchema.safeParse({ status: 'OTHER' }).success, false);
});

test('changes status in every direction without removing contacts', async () => {
  const customer = new Customer({ id: 'customer', userId: 'owner', name: 'Ana', status: 'ACTIVE', contacts: [{ type: 'INSTAGRAM', value: 'ana' }] });
  const service = new UpdateCustomer({
    findById: async (id, userId) => id === 'customer' && userId === 'owner' ? customer : null,
    update: async value => value,
  });
  for (const status of ['OCCASIONAL', 'INACTIVE', 'ACTIVE']) {
    const saved = await service.execute({ id: 'customer', userId: 'owner', status });
    assert.equal(saved.status, status);
    assert.deepEqual(saved.contacts, [{ type: 'INSTAGRAM', value: 'ana' }]);
  }
  await assert.rejects(() => service.execute({ id: 'customer', userId: 'other', status: 'OCCASIONAL' }));
});

test('forwards search, status and pagination together to the repository', async () => {
  let received;
  const service = new ListCustomers({ findAllWithStats: async (...args) => { received = args; return { data: [], total: 23 }; } });
  const result = await service.execute({ userId: 'owner', page: 2, limit: 10, search: 'Ana', status: 'OCCASIONAL' });
  assert.deepEqual(received, ['owner', 10, 10, 'Ana', 'OCCASIONAL']);
  assert.equal(result.total, 23);
});

test('filters both count and page queries by status and owner; counts all categories', async () => {
  const calls = [];
  prisma.$transaction = async queries => Promise.all(queries);
  prisma.customer.count = async args => {
    calls.push({ type: 'count', ...args });
    assert.equal(args.where.userId, 'owner');
    assert.equal(args.where.deletedAt, null);
    return args.where.status === 'ACTIVE' ? 12 : args.where.status === 'INACTIVE' ? 4 : args.where.status === 'OCCASIONAL' ? 7 : args.where.createdAt ? 2 : 23;
  };
  prisma.customer.findMany = async args => { calls.push({ type: 'list', ...args }); return []; };
  const repository = new CustomersRepository();
  await repository.findAllWithStats('owner', 10, 10, 'Ana', 'OCCASIONAL');
  assert.equal(calls.length, 2);
  for (const call of calls) {
    assert.equal(call.where.status, 'OCCASIONAL');
    assert.equal(call.where.userId, 'owner');
    assert.equal(call.where.deletedAt, null);
    assert.deepEqual(call.where.name, { contains: 'Ana', mode: 'insensitive' });
  }
  assert.equal(calls[1].skip, 10);
  assert.equal(calls[1].take, 10);
  calls.length = 0;
  await repository.findAllWithStats('owner', 0, 10);
  assert.equal(Object.hasOwn(calls[0].where, 'status'), false);
  assert.deepEqual(await repository.getDashboard('owner'), { total: 23, active: 12, inactive: 4, occasional: 7, newThisMonth: 2 });
});
