import type { UserToken } from "@prisma/client";

export interface ICreateUserTokenDTO {
  user_id: string;
  expires_date: Date;
  refreshToken: string;
}

export interface IUserTokensRepository {
  create(data: ICreateUserTokenDTO): Promise<UserToken>;
  findByUserIdAndRefreshToken(
    user_id: string,
    refresh_token: string,
  ): Promise<UserToken | null>;
  deleteById(id: string): Promise<void>;
  findByRefreshToken(refresh_token: string): Promise<UserToken | null>;
}
