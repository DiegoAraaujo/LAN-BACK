import dayjs from "dayjs";
import authConfig from "../../../config/auth.js";

import { AppError } from "../../../shared/errors/AppError.js";

import type { IUserTokensRepository } from "../../../interfaces/IUserTokensRepository.js";
import type { IJWTProvider } from "../../../shared/providers/JsonwebtokenProvider.js";

interface IRequest {
  refreshToken: string;
}

interface IResponse {
  token: string;
  refreshToken: string;
}

export class RefreshTokenService {
  constructor(
    private userTokensRepository: IUserTokensRepository,
    private jwtProvider: IJWTProvider,
  ) {}

  async execute({ refreshToken }: IRequest): Promise<IResponse> {
    try {
      const { sub: user_id, email } = await this.jwtProvider.verify(
        refreshToken,
        authConfig.jwt.refresh_token_secret,
      );
      const userToken =
        await this.userTokensRepository.findByUserIdAndRefreshToken(
          user_id,
          refreshToken,
        );

      if (!userToken) {
        throw new AppError(
          "Refresh token does not exist!",
          401,
          "TOKEN_NOT_FOUND",
        );
      }
      await this.userTokensRepository.deleteById(userToken.id);

      const newToken = await this.jwtProvider.sign(
        {},
        authConfig.jwt.access_token_secret,
        authConfig.jwt.access_token_expires_in,
        user_id,
      );

      const newRefreshToken = await this.jwtProvider.sign(
        { email },
        authConfig.jwt.refresh_token_secret,
        authConfig.jwt.refresh_token_expires_in,
        user_id,
      );

      const expires_date = dayjs()
        .add(authConfig.jwt.refresh_token_expires_days, "days")
        .toDate();

      await this.userTokensRepository.create({
        user_id,
        refreshToken: newRefreshToken,
        expires_date,
      });

      return {
        token: newToken,
        refreshToken: newRefreshToken,
      };
    } catch {
      throw new AppError(
        "Invalid or expired refresh token",
        401,
        "TOKEN_INVALID",
      );
    }
  }
}
