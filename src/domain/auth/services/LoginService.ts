import { compare } from "bcryptjs";
import dayjs from "dayjs";

import authConfig from "../../../config/auth.js";
import { AppError } from "../../../shared/errors/AppError.js";

import type User from "../../users/UserEntity.js";
import type { IUserRepository } from "../../users/IUserRepository.js";
import type { IUserTokensRepository } from "../../../interfaces/IUserTokensRepository.js";

import type { IJWTProvider } from "../../../shared/providers/JsonwebtokenProvider.js";

interface IRequest {
  email: string;
  password: string;
  remember?: boolean;
}

interface IResponse {
  user: User;
  token: string;
  refreshToken: string;
}

class LoginService {
  constructor(
    private userRepository: IUserRepository,
    private userTokensRepository: IUserTokensRepository,
    private jwtProvider: IJWTProvider,
  ) {}

  async execute({ email, password, remember = false }: IRequest): Promise<IResponse> {
    const user = await this.userRepository.findByEmail(email);

    if (!user) {
      throw new AppError(
        "Email or password incorrect.",
        401,
        "INVALID_CREDENTIALS",
      );
    }

    const passwordMatched = await compare(password, user.password);

    if (!passwordMatched) {
      throw new AppError(
        "Email or password incorrect.",
        401,
        "INVALID_CREDENTIALS",
      );
    }

    const token = await this.jwtProvider.sign(
      {},
      authConfig.jwt.access_token_secret,
      authConfig.jwt.access_token_expires_in,
      user.id!,
    );

    const refreshToken = await this.jwtProvider.sign(
      { email, remember },
      authConfig.jwt.refresh_token_secret,
      authConfig.jwt.refresh_token_expires_in,
      user.id!,
    );

    const expires_date = dayjs()
      .add(authConfig.jwt.refresh_token_expires_days, "days")
      .toDate();

    await this.userTokensRepository.create({
      user_id: user.id!,
      refreshToken,
      expires_date,
    });

    return {
      user,
      token,
      refreshToken,
    };
  }
}

export default LoginService;
