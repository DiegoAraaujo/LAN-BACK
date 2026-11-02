import { compare, hash } from 'bcryptjs';
import { prisma } from '../../../shared/database/prisma.js';
import { AppError } from '../../../shared/errors/AppError.js';
import {
  changePasswordSchema,
  type ChangePasswordInput,
} from '../../../shared/validation/fields.js';

export class ChangePasswordService {
  constructor(private database = prisma) {}

  async execute(userId: string, input: ChangePasswordInput): Promise<void> {
    const data = changePasswordSchema.parse(input);
    const user = await this.database.user.findUnique({
      where: { id: userId },
      select: { password: true, sessionVersion: true },
    });
    if (!user) throw new AppError('User not found.', 404, 'USER_NOT_FOUND');
    if (!(await compare(data.currentPassword, user.password)))
      throw new AppError('A senha atual esta incorreta.', 400, 'CURRENT_PASSWORD_INVALID');
    const password = await hash(data.newPassword, 12);
    await this.database.$transaction(async (tx) => {
      const changed = await tx.user.updateMany({
        where: { id: userId, password: user.password, sessionVersion: user.sessionVersion },
        data: { password, sessionVersion: { increment: 1 } },
      });
      if (changed.count !== 1)
        throw new AppError(
          'A conta foi alterada. Entre novamente.',
          409,
          'PASSWORD_CHANGE_CONFLICT',
        );
      await tx.userToken.deleteMany({ where: { user_id: userId } });
    });
  }
}
