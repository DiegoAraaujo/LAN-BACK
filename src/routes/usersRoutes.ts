import rateLimit from 'express-rate-limit';
import { ChangePasswordService } from '../domain/users/services/ChangePasswordService.js';
import { changePasswordSchema } from '../shared/validation/fields.js';
import { clearSessionCookies } from '../shared/http/sessionCookies.js';
import { Router } from 'express';

import { ensureAuthenticated } from '../shared/middlewares/ensureAuthenticated.js';
import { usersController } from '../domain/users/usersFactory.js';
import { prisma } from '../shared/database/prisma.js';
import { AppError } from '../shared/errors/AppError.js';

const usersRoutes = Router();
usersRoutes.get('/me', ensureAuthenticated, async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: { name: true, email: true, profileImage: true, createdAt: true },
  });
  if (!user) throw new AppError('User not found', 404, 'USER_NOT_FOUND');
  res.json(user);
});

const passwordChangeLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.user.id,
  handler: (_req, res) => {
    res
      .status(429)
      .json({ code: 'TOO_MANY_REQUESTS', message: 'Aguarde antes de tentar novamente.' });
  },
});
usersRoutes.patch('/password', ensureAuthenticated, passwordChangeLimit, async (req, res) => {
  await new ChangePasswordService().execute(req.user.id, changePasswordSchema.parse(req.body));
  clearSessionCookies(res);
  res.sendStatus(204);
});

usersRoutes.post('/', (req, res) => usersController.create(req, res));

usersRoutes.patch('/', ensureAuthenticated, (req, res) => usersController.update(req, res));

export { usersRoutes };
