import { JsonwebtokenProvider } from "../../shared/providers/JsonwebtokenProvider.js";
import UsersRepository from "../users/UsersRepository.js";
import AuthController from "./AuthController.js";
import LoginService from "./services/LoginService.js";
import { RefreshTokenService } from "./services/RefreshTokenService.js";
import { UserTokensRepository } from "./UserTokensRepository.js";
import { LogoutService } from "./services/LogoutService.js";

const usersTokenRepository = new UserTokensRepository();
const usersRepository = new UsersRepository();
const jwtProvider = new JsonwebtokenProvider();

const loginService = new LoginService(
  usersRepository,
  usersTokenRepository,
  jwtProvider,
);

const refreshTokenService = new RefreshTokenService(
  usersTokenRepository,
  jwtProvider,
);

export const authController = new AuthController(
  loginService,
  refreshTokenService,
  new LogoutService(usersTokenRepository),
);
