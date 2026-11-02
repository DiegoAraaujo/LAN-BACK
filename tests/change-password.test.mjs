import test from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import express from 'express';
import jwt from 'jsonwebtoken';
import { hash, compare } from 'bcryptjs';
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = 'postgresql://test:test@127.0.0.1:1/test';
process.env.JWT_ACCESS_SECRET = 'test-access-secret-only';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-only';
const { ChangePasswordService } =
  await import('../src/domain/users/services/ChangePasswordService.ts');
const { changePasswordSchema } = await import('../src/shared/validation/fields.ts');
const { prisma } = await import('../src/shared/database/prisma.ts');
const { usersRoutes } = await import('../src/routes/usersRoutes.ts');
const { errorHandler } = await import('../src/shared/middlewares/errorHandler.ts');
const { browserSecurity } = await import('../src/shared/middlewares/browserSecurity.ts');
const { accessCookie, refreshCookie } = await import('../src/shared/http/sessionCookies.ts');
const input = {
  currentPassword: 'OldPassword123',
  newPassword: 'NewPassword456',
  confirmPassword: 'NewPassword456',
};

function database(initial, { conflict = false, failDelete = false } = {}) {
  let state = { ...initial, tokens: 2 };
  return {
    state: () => state,
    user: { findUnique: async ({ where }) => (where.id === 'owner' ? { ...state } : null) },
    $transaction: async (work) => {
      const draft = { ...state };
      const result = await work({
        user: {
          updateMany: async ({ where, data }) => {
            assert.equal(where.id, 'owner');
            assert.equal(where.password, state.password);
            if (conflict) return { count: 0 };
            draft.password = data.password;
            draft.sessionVersion += data.sessionVersion.increment;
            return { count: 1 };
          },
        },
        userToken: {
          deleteMany: async ({ where }) => {
            assert.equal(where.user_id, 'owner');
            if (failDelete) throw Error('delete failed');
            draft.tokens = 0;
            return { count: 2 };
          },
        },
      });
      state = draft;
      return result;
    },
  };
}

test('schema rejects blank current password, short/mismatched/reused/oversized new passwords', () => {
  for (const patch of [
    { currentPassword: '' },
    { newPassword: '1234567', confirmPassword: '1234567' },
    { confirmPassword: 'different123' },
    { newPassword: input.currentPassword, confirmPassword: input.currentPassword },
    { newPassword: 'x'.repeat(73), confirmPassword: 'x'.repeat(73) },
    { newPassword: '\u{1F600}'.repeat(19), confirmPassword: '\u{1F600}'.repeat(19) },
  ])
    assert.equal(changePasswordSchema.safeParse({ ...input, ...patch }).success, false);
  assert.equal(changePasswordSchema.safeParse(input).success, true);
});
test('wrong current password cannot change credentials or sessions', async () => {
  const db = database({ password: await hash(input.currentPassword, 4), sessionVersion: 0 });
  await assert.rejects(
    () => new ChangePasswordService(db).execute('owner', { ...input, currentPassword: 'wrong' }),
    (error) => error.code === 'CURRENT_PASSWORD_INVALID',
  );
  assert.equal(db.state().sessionVersion, 0);
  assert.equal(db.state().tokens, 2);
});
test('password changes are hashed and revoke access and refresh sessions together', async () => {
  const db = database({ password: await hash(input.currentPassword, 4), sessionVersion: 3 });
  await new ChangePasswordService(db).execute('owner', input);
  assert.equal(await compare(input.newPassword, db.state().password), true);
  assert.equal(await compare(input.currentPassword, db.state().password), false);
  assert.notEqual(db.state().password, input.newPassword);
  assert.equal(db.state().sessionVersion, 4);
  assert.equal(db.state().tokens, 0);
});
test('concurrent password changes cannot overwrite each other', async () => {
  const db = database(
    { password: await hash(input.currentPassword, 4), sessionVersion: 0 },
    { conflict: true },
  );
  await assert.rejects(
    () => new ChangePasswordService(db).execute('owner', input),
    (error) => error.code === 'PASSWORD_CHANGE_CONFLICT',
  );
  assert.equal(db.state().sessionVersion, 0);
  assert.equal(db.state().tokens, 2);
});
test('failure to revoke tokens rolls back the password update', async () => {
  const original = await hash(input.currentPassword, 4);
  const db = database({ password: original, sessionVersion: 0 }, { failDelete: true });
  await assert.rejects(() => new ChangePasswordService(db).execute('owner', input));
  assert.equal(db.state().password, original);
  assert.equal(db.state().tokens, 2);
});
test('authenticated HTTP endpoint enforces current password, clears cookies and rejects revoked sessions', async () => {
  const db = database({ password: await hash(input.currentPassword, 4), sessionVersion: 0 });
  prisma.user.findUnique = db.user.findUnique;
  prisma.$transaction = db.$transaction;
  const app = express();
  app.use(express.json());
  app.use(browserSecurity);
  app.use('/users', usersRoutes);
  app.use(errorHandler);
  const server = app.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const url = `http://127.0.0.1:${server.address().port}/users/password`;
  const token = jwt.sign({ sessionVersion: 0 }, process.env.JWT_ACCESS_SECRET, {
    subject: 'owner',
    expiresIn: '1h',
  });
  const send = (body, cookie = true, csrf = true) =>
    fetch(url, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Origin: 'http://localhost:3000',
        ...(csrf ? { 'X-CSRF-Protection': '1' } : {}),
        ...(cookie ? { Cookie: `${accessCookie}=${token}` } : {}),
      },
      body: JSON.stringify(body),
    });
  try {
    assert.equal((await send(input, false)).status, 401);
    assert.equal((await send(input, true, false)).status, 403);
    assert.equal((await send({ ...input, confirmPassword: 'bad' })).status, 400);
    const wrong = await send({ ...input, currentPassword: 'wrong' });
    assert.equal(wrong.status, 400);
    assert.equal((await wrong.json()).code, 'CURRENT_PASSWORD_INVALID');
    const changed = await send({ ...input, userId: 'another-account' });
    assert.equal(changed.status, 204);
    const cookies = changed.headers.getSetCookie();
    assert.ok(cookies.some((cookie) => cookie.startsWith(accessCookie + '=;')));
    assert.ok(cookies.some((cookie) => cookie.startsWith(refreshCookie + '=;')));
    assert.equal((await send(input)).status, 401);
    assert.equal(db.state().tokens, 0);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});
