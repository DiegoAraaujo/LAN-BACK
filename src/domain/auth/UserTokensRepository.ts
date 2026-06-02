import type { UserToken } from "@prisma/client";
import type {
  ICreateUserTokenDTO,
  IUserTokensRepository,
} from "../../interfaces/IUserTokensRepository.js";
import { prisma } from "../../shared/database/prisma.js";

export class UserTokensRepository implements IUserTokensRepository {
  async create({
    user_id,
    expires_date,
    refreshToken,
  }: ICreateUserTokenDTO): Promise<UserToken> {
    const userToken = await prisma.userToken.create({
      data: {
        user_id,
        expires_date,
        refresh_token: refreshToken,
      },
    });

    return userToken;
  }

  async findByUserIdAndRefreshToken(
    user_id: string,
    refresh_token: string,
  ): Promise<UserToken | null> {
    return await prisma.userToken.findFirst({
      where: {
        user_id,
        refresh_token,
      },
    });
  }

  async findByRefreshToken(refresh_token: string): Promise<UserToken | null> {
    return await prisma.userToken.findUnique({
      where: { refresh_token },
    });
  }

  async deleteById(id: string): Promise<void> {
    await prisma.userToken.delete({
      where: { id },
    });
  }
}
