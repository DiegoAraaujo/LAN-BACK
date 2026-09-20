import dayjs from "dayjs";
import authConfig from "../../../config/auth.js";

import { AppError } from "../../../shared/errors/AppError.js";

import type { IUserTokensRepository } from "../../../interfaces/IUserTokensRepository.js";
import type { IJWTProvider } from "../../../shared/providers/JsonwebtokenProvider.js";
import type { IUserRepository } from "../../users/IUserRepository.js";

interface IRequest {
  refreshToken: string;
}

interface IResponse {
  remember: boolean;
  token: string;
  refreshToken: string;
}

export class RefreshTokenService {
  constructor(
    private userTokensRepository: IUserTokensRepository,
    private jwtProvider: IJWTProvider,
    private userRepository: IUserRepository,
  ) {}

  async execute({ refreshToken }: IRequest): Promise<IResponse> {
    try {
      const { sub: user_id, email, remember, sessionVersion } = await this.jwtProvider.verify(
        refreshToken,
        authConfig.jwt.refresh_token_secret,
      );
      const userToken =
        await this.userTokensRepository.findByUserIdAndRefreshToken(
          user_id,
          refreshToken,
        );

      if (!userToken || userToken.expires_date <= new Date()) {
        throw new AppError(
          "Refresh token does not exist!",
          401,
          "TOKEN_NOT_FOUND",
        );
      }

      const user = await this.userRepository.findById(user_id);
      if (!user || user.sessionVersion !== sessionVersion) {
        throw new AppError("Session was revoked", 401, "TOKEN_INVALID");
      }

      const newToken = await this.jwtProvider.sign(
        { sessionVersion: user.sessionVersion },
        authConfig.jwt.access_token_secret,
        authConfig.jwt.access_token_expires_in,
        user_id,
      );

      const newRefreshToken = await this.jwtProvider.sign(
        { email, remember: remember === true, sessionVersion: user.sessionVersion },
        authConfig.jwt.refresh_token_secret,
        authConfig.jwt.refresh_token_expires_in,
        user_id,
      );

      const expires_date = dayjs()
        .add(authConfig.jwt.refresh_token_expires_days, "days")
        .toDate();

      const rotated = await this.userTokensRepository.rotate(userToken.id, {
        user_id,
        refreshToken: newRefreshToken,
        expires_date,
      });
      if (!rotated) {
        throw new AppError("Invalid or expired refresh token", 401, "TOKEN_INVALID");
      }

      return {
        remember: remember === true,
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
