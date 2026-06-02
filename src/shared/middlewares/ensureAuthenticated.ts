import type { NextFunction, Request, Response } from "express";
import authConfig from "../../config/auth.js";
import { AppError } from "../errors/AppError.js";
import { JsonwebtokenProvider } from "../providers/JsonwebtokenProvider.js";

export async function ensureAuthenticated(
  request: Request,
  response: Response,
  next: NextFunction,
) {
  const authHeader = request.headers.authorization;

  if (!authHeader) {
    throw new AppError("Token missing", 401);
  }

  const [, token] = authHeader.split(" ");

  const jwtProvider = new JsonwebtokenProvider();

  if (!token) {
    throw new AppError("Token missing", 401);
  }
  
  try {
    const payload = await jwtProvider.verify(
      token,
      authConfig.jwt.access_token_secret,
    );

    if (!payload.sub) {
      throw new AppError("Invalid token payload", 401);
    }

    request.user = {
      id: payload.sub,
    };

    return next();
  } catch {
    throw new AppError("Invalid token!", 401, "TOKEN_EXPIRED");
  }
}
