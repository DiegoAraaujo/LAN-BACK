import type { Request, Response } from "express";

import type LoginService from "./services/LoginService.js";
import type { RefreshTokenService } from "./services/RefreshTokenService.js";

import { createSessionSchema } from "./schemas/authSchema.js";
import { readCookie, refreshCookie, setSessionCookies, clearSessionCookies } from "../../shared/http/sessionCookies.js";
import { AppError } from "../../shared/errors/AppError.js";
import type { LogoutService } from "./services/LogoutService.js";
import { UserMapper } from "../users/UsersMappers.js";

class AuthController {
  constructor(
    private loginService: LoginService,
    private refreshTokenService: RefreshTokenService,
    private logoutService: LogoutService,
  ) {}

  async login(request: Request, response: Response) {
    const { email, password, remember } = createSessionSchema.parse(request.body);

    const { user, token, refreshToken } = await this.loginService.execute({
      email,
      password,
      remember,
    });

    const previous = readCookie(request, refreshCookie);
    if (previous) await this.logoutService.execute({ refreshToken: previous });
    setSessionCookies(response, token, refreshToken, remember);
    return response.json({
      user: UserMapper.toResponse(user),
    });
  }

  async createRefreshToken(request: Request, response: Response) {
    const refreshToken = readCookie(request, refreshCookie);
    if (!refreshToken) throw new AppError("Session expired", 401, "TOKEN_INVALID");
    const refresh = await this.refreshTokenService.execute({refreshToken});

    setSessionCookies(response, refresh.token, refresh.refreshToken, refresh.remember);
    return response.status(204).send();
  }

  async logout(request: Request, response: Response) {
    const refreshToken = readCookie(request, refreshCookie);
    if (refreshToken) await this.logoutService.execute({ refreshToken });
    clearSessionCookies(response);
    return response.status(204).send();
  }
}

export default AuthController;
