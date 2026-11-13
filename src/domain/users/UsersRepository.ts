import type { IUserRepository } from './IUserRepository.js';
import { prisma } from '../../shared/database/prisma.js';
import User from './UserEntity.js';

class UsersRepository implements IUserRepository {
  async create(user: User): Promise<User> {
    const created = await prisma.user.create({
      data: {
        name: user.name,
        email: user.email,
        profileImage: user.profileImage,
        password: user.password,
      },
    });

    return new User({ ...created });
  }

  async findByEmail(email: string): Promise<User | null> {
    // Emails are stored lowercased, but older accounts may still have mixed case.
    const matches = await prisma.user.findMany({
      where: { email: { equals: email, mode: 'insensitive' } },
      take: 5,
    });
    const user =
      matches.find((item) => item.email === email) ?? (matches.length === 1 ? matches[0] : null);

    if (!user) return null;

    return new User({ ...user });
  }

  async findById(id: string): Promise<User | null> {
    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) return null;

    return new User({ ...user });
  }

  async update(user: User): Promise<User> {
    if (!user.id) {
      throw new Error('User ID is required for update operation');
    }

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: {
        name: user.name,
        email: user.email,
        profileImage: user.profileImage,
      },
    });

    return new User({ ...updated });
  }
}

export default UsersRepository;
