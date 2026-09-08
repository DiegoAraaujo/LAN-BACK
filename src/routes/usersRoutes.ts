import { Router } from "express";

import { ensureAuthenticated } from "../shared/middlewares/ensureAuthenticated.js";
import { usersController } from "../domain/users/usersFactory.js";
import { prisma } from '../shared/database/prisma.js';
import { AppError } from '../shared/errors/AppError.js';

const usersRoutes = Router();
usersRoutes.get('/me', ensureAuthenticated, async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.user.id }, select: { name: true, email: true, createdAt: true } });
  if (!user) throw new AppError('User not found', 404, 'USER_NOT_FOUND');
  res.json(user);
});

usersRoutes.post("/", (req, res) => usersController.create(req, res));

usersRoutes.patch("/", ensureAuthenticated, (req, res) =>
  usersController.update(req, res),
);

export { usersRoutes };
