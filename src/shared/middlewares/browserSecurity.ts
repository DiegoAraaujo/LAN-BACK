import type { Request, Response, NextFunction } from "express";
import { AppError } from "../errors/AppError.js";

export const allowedOrigins = process.env.NODE_ENV === "production"
  ? ["https://app.jdbarbeariatapuio.com.br"]
  : ["http://localhost:3000"];

export function browserSecurity(req: Request, res: Response, next: NextFunction) {
  res.setHeader("Cache-Control", "no-store");
  const origin = req.headers.origin;
  if (origin && !allowedOrigins.includes(origin)) {
    throw new AppError("Origin not allowed", 403, "FORBIDDEN");
  }
  if (!["GET", "HEAD", "OPTIONS"].includes(req.method)) {
    // Exact origin plus a non-simple header blocks cross-site forms and sibling subdomains.
    if (!origin || !allowedOrigins.includes(origin) || req.get("X-CSRF-Protection") !== "1") {
      throw new AppError("Request origin could not be verified", 403, "FORBIDDEN");
    }
  }
  next();
}
