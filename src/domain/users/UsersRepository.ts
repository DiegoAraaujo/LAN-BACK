import type { IUserRepository } from "./IUserRepository.js";
import { prisma } from "../../shared/database/prisma.js";
import User from "./UserEntity.js";

class UsersRepository implements IUserRepository {
  async create(user: User): Promise<User> {
    const created = await prisma.user.create({
      data: {
        name: user.name,
        email: user.email,
        password: user.password,
      },
    });

    return new User({ ...created });
  }

  async findByEmail(email: string): Promise<User | null> {
    const user = await prisma.user.findUnique({
      where: { email },
    });

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
      throw new Error("User ID is required for update operation");
    }

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: {
        name: user.name,
        email: user.email,
      },
    });

    return new User({ ...updated });
  }
}

export default UsersRepository;
