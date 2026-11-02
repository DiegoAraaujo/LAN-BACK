import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
process.env.DATABASE_URL = 'postgresql://test:test@127.0.0.1:1/test';
const front = new URL('../../lan-front/src/', import.meta.url);
const available = existsSync(front);
const id = '123e4567-e89b-42d3-a456-426614174000';
const now = new Date().toISOString();
const customer = { name: 'Lu' };
const appointment = {
  customerId: id,
  appointmentDate: now,
  paymentStatus: 'PENDING',
  items: [{ serviceId: id, professionalId: id }],
};
const payment = { requestId: id, payments: [], useCredit: 25, excess: 'CHANGE', occurredAt: now };
const entry = {
  requestId: id,
  kind: 'INCOME',
  amount: 25,
  status: 'POSTED',
  method: 'PIX',
  occurredAt: now,
};
const pairs = [
  [
    'customers/schemas/customer-payload.schemas.ts',
    'domain/customers/customerSchema.ts',
    'createCustomerSchema',
    [
      customer,
      { name: ' ' },
      { name: 'x'.repeat(101) },
      { ...customer, contacts: [{ type: 'WHATSAPP', value: 'abc' }] },
      { ...customer, contacts: [{ type: 'INSTAGRAM', value: '@ana.silva' }] },
      { ...customer, contacts: [{ type: 'INSTAGRAM', value: 'invalid space' }] },
    ],
  ],
  [
    'professionals/schemas/professional-payload.schemas.ts',
    'domain/professionals/professionalsSchema.ts',
    'createProfessionalSchema',
    [
      customer,
      { name: ' ' },
      { ...customer, phone: '' },
      { ...customer, phone: '123' },
      { ...customer, profileImage: 'not an image' },
      { ...customer, servicesIds: ['invalid'] },
    ],
  ],
  [
    'services/schemas/service-payload.schemas.ts',
    'domain/services/serviceSchema.ts',
    'createServiceSchema',
    [
      { name: 'Corte', price: 0 },
      { name: 'Corte', price: -1 },
      { name: 'Corte', price: 1000000 },
      { name: 'Corte', price: 1.234 },
      { name: 'Corte', price: 1, description: 'x'.repeat(301) },
    ],
  ],
  [
    'appointments/schemas/appointment.schemas.ts',
    'domain/appointments/appointmentsSchema.ts',
    'createAppointmentBodySchema',
    [
      appointment,
      { ...appointment, items: [] },
      { ...appointment, discount: -1 },
      { ...appointment, notes: 'x'.repeat(2001) },
      { ...appointment, initialPayment: payment },
      { ...appointment, initialPayment: { ...payment, useCredit: -1 } },
    ],
  ],
  [
    'finance/finance.schemas.ts',
    'domain/finance/FinanceService.ts',
    'entrySchema',
    [
      entry,
      { ...entry, description: '' },
      { ...entry, amount: 0 },
      { ...entry, amount: 1.234 },
      { ...entry, kind: 'CREDIT' },
      { ...entry, kind: 'CREDIT', customerId: id },
      { ...entry, occurredAt: new Date(Date.now() + 86400000).toISOString() },
    ],
  ],
  [
    'finance/finance.schemas.ts',
    'domain/finance/FinanceService.ts',
    'paymentSchema',
    [
      payment,
      { ...payment, useCredit: 0 },
      { ...payment, useCredit: 1000000 },
      { ...payment, payments: [{ method: 'UNKNOWN', amount: 10 }] },
    ],
  ],
  [
    'settings/schemas/user.schemas.ts',
    'domain/users/usersSchemas.ts',
    'createUserSchema',
    [
      {
        name: 'Lu',
        email: 'lu@example.com',
        password: 'abcdefgh',
        confirmPassword: 'abcdefgh',
        terms: true,
      },
      {
        name: 'Lu',
        email: 'lu@example.com',
        password: '1234567',
        confirmPassword: '1234567',
        terms: true,
      },
      {
        name: 'Lu',
        email: 'lu@example.com',
        password: 'abcdefgh',
        confirmPassword: 'different',
        terms: true,
      },
    ],
  ],
];
pairs.push(
  [
    'customers/schemas/customer-payload.schemas.ts',
    'domain/customers/customerSchema.ts',
    'updateCustomerSchema',
    [
      { name: 'Lu', address: '' },
      { name: ' ' },
      { contacts: [] },
      { contacts: [{ type: 'WHATSAPP', value: 'abc11999999999' }] },
    ],
  ],
  [
    'professionals/schemas/professional-payload.schemas.ts',
    'domain/professionals/professionalsSchema.ts',
    'updateProfessionalSchema',
    [
      { phone: '' },
      { phone: '(11) 99999-9999' },
      { phone: 'abc11999999999' },
      { servicesIds: ['bad'] },
    ],
  ],
  [
    'services/schemas/service-payload.schemas.ts',
    'domain/services/serviceSchema.ts',
    'updateServiceSchema',
    [{ price: 0 }, { price: NaN }, { price: 1.234 }, { description: null }],
  ],
  [
    'appointments/schemas/appointment.schemas.ts',
    'domain/appointments/appointmentsSchema.ts',
    'updateAppointmentBodySchema',
    [{ notes: '' }, { notes: 'x'.repeat(2001) }, { discount: 1.234 }, { initialPayment: payment }],
  ],
  [
    'settings/schemas/user.schemas.ts',
    'domain/users/usersSchemas.ts',
    'updateUserSchema',
    [{ name: 'Lu' }, { email: 'invalid' }, { password: 'forbidden' }, {}],
  ],
);
for (const [frontPath, backPath, name, cases] of pairs)
  test(`frontend/backend agreement: ${name}`, { skip: !available }, async () => {
    const frontModule = await import(new URL('features/' + frontPath, front));
    const backModule = await import(new URL('../src/' + backPath, import.meta.url));
    for (const value of cases)
      assert.equal(
        frontModule[name].safeParse(value).success,
        backModule[name].safeParse(value).success,
      );
  });
test(
  'common field and filter policies remain identical in both projects',
  { skip: !available },
  () => {
    assert.equal(
      readFileSync(new URL('lib/validation.ts', front), 'utf8').replaceAll('\r\n', '\n'),
      readFileSync(
        new URL('../src/shared/validation/fields.ts', import.meta.url),
        'utf8',
      ).replaceAll('\r\n', '\n'),
    );
    assert.equal(
      readFileSync(new URL('lib/query-validation.ts', front), 'utf8').replaceAll('\r\n', '\n'),
      readFileSync(
        new URL('../src/shared/validation/queries.ts', import.meta.url),
        'utf8',
      ).replaceAll('\r\n', '\n'),
    );
  },
);

test(
  'password and query validators agree on rejection as well as acceptance',
  { skip: !available },
  async () => {
    const frontFields = await import(new URL('lib/validation.ts', front));
    const backFields = await import('../src/shared/validation/fields.ts');
    const frontQueries = await import(new URL('lib/query-validation.ts', front));
    const backQueries = await import('../src/shared/validation/queries.ts');
    for (const patch of [
      {},
      { currentPassword: '' },
      { newPassword: 'short' },
      { confirmPassword: 'different' },
    ]) {
      const value = {
        currentPassword: 'OldPassword123',
        newPassword: 'NewPassword456',
        confirmPassword: 'NewPassword456',
        ...patch,
      };
      assert.equal(
        frontFields.changePasswordSchema.safeParse(value).success,
        backFields.changePasswordSchema.safeParse(value).success,
      );
    }
    for (const [schema, cases] of [
      [
        'customerQuerySchema',
        [{}, { page: -1 }, { limit: 101 }, { status: 'OTHER' }, { search: 'x'.repeat(201) }],
      ],
      [
        'dashboardQuerySchema',
        [
          { year: 2026 },
          { year: 1999 },
          { dateFrom: '2026-02-30', dateTo: '2026-03-01' },
          { dateFrom: '2026-01-01' },
        ],
      ],
      [
        'financeQuerySchema',
        [
          { from: '2026-01-01', to: '2026-01-31' },
          { from: '2026-02-01', to: '2026-01-01' },
        ],
      ],
    ])
      for (const value of cases)
        assert.equal(
          frontQueries[schema].safeParse(value).success,
          backQueries[schema].safeParse(value).success,
        );
  },
);
