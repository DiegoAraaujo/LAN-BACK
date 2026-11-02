import test from 'node:test';
import assert from 'node:assert/strict';
process.env.DATABASE_URL = 'postgresql://test:test@127.0.0.1:1/test';
const { prisma } = await import('../src/shared/database/prisma.ts');
const { ProfessionalsRepository } =
  await import('../src/domain/professionals/ProfessionalsRepository.ts');
const { CreateProfessional } =
  await import('../src/domain/professionals/services/CreateProfessional.ts');
const { UpdateProfessional } =
  await import('../src/domain/professionals/services/UpdateProfessional.ts');
const { Professional } = await import('../src/domain/professionals/ProfessionalEntity.ts');
const phone = '11999999999';
const row = (userId, deletedAt = null) => ({
  id: userId + '-pro',
  name: 'Ana',
  address: '',
  phone,
  userId,
  deletedAt,
  authorizedServices: [],
});
function setup(rows) {
  prisma.professional.findFirst = async ({ where }) => {
    assert.equal(typeof where.userId, 'string');
    assert.equal(where.deletedAt, null);
    return (
      rows.find((row) => Object.entries(where).every(([key, value]) => row[key] === value)) ?? null
    );
  };
  const repository = new ProfessionalsRepository();
  repository.create = async (value) => value;
  repository.update = async (value) => value;
  repository.findById = async (id, userId) =>
    new Professional({ ...row(userId), id, phone: '11888888888', servicesIds: [] });
  return repository;
}

test('phone lookup isolates accounts and excludes deleted professionals', async () => {
  const repository = setup([row('other'), row('owner', new Date())]);
  assert.equal(await repository.findByPhone(phone, 'owner'), null);
  assert.equal((await repository.findByPhone(phone, 'other')).userId, 'other');
});

test('creation allows the same phone in another barbershop but rejects it within the account', async () => {
  const repository = setup([row('other')]);
  const service = new CreateProfessional(repository, {});
  assert.equal((await service.execute({ userId: 'owner', name: 'Bia', phone })).phone, phone);
  await assert.rejects(
    () => service.execute({ userId: 'other', name: 'Bia', phone }),
    (error) => error.code === 'PROFESSIONAL_ALREADY_EXISTS' || error.statusCode === 409,
  );
});

test('editing checks duplicates only within the authenticated account', async () => {
  const repository = setup([row('other')]);
  const service = new UpdateProfessional(repository, {});
  assert.equal((await service.execute({ id: 'edit', userId: 'owner', phone })).phone, phone);
  await assert.rejects(() => service.execute({ id: 'edit', userId: 'other', phone }));
});
