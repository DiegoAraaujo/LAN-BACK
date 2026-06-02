import type { Request, Response } from "express";

import type LoginService from "./services/LoginService.js";
import type { RefreshTokenService } from "./services/RefreshTokenService.js";

import { createSessionSchema } from "./schemas/authSchema.js";
import { UserMapper } from "../users/UsersMappers.js";

class AuthController {
  constructor(
    private loginService: LoginService,
    private refreshTokenService: RefreshTokenService,
  ) {}

  async login(request: Request, response: Response) {
    const { email, password } = createSessionSchema.parse(request.body);

    const { user, token, refreshToken } = await this.loginService.execute({
      email,
      password,
    });

    return response.json({
      user: UserMapper.toResponse(user),
      token,
      refreshToken,
    });
  }

  async createRefreshToken(request: Request, response: Response) {
    const refreshToken = request.body.token;
    const refresh = await this.refreshTokenService.execute({refreshToken});

    return response.json(refresh);
  }
}

export default AuthController;
