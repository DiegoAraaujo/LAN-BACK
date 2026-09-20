import type { NextFunction, Request, Response } from "express";
import authConfig from "../../config/auth.js";
import { AppError } from "../errors/AppError.js";
import { JsonwebtokenProvider } from "../providers/JsonwebtokenProvider.js";
import { accessCookie, readCookie } from "../http/sessionCookies.js";
import { prisma } from "../database/prisma.js";

export async function ensureAuthenticated(
  request: Request,
  response: Response,
  next: NextFunction,
) {
  const token = readCookie(request, accessCookie);

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

    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: { sessionVersion: true },
    });
    if (!user || user.sessionVersion !== payload.sessionVersion) {
      throw new AppError("Session was revoked", 401, "TOKEN_EXPIRED");
    }

    request.user = {
      id: payload.sub,
    };

    return next();
  } catch {
    throw new AppError("Invalid token!", 401, "TOKEN_EXPIRED");
  }
}
