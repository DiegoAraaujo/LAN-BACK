import type { Request, Response, NextFunction } from "express";
import { AppError } from "../errors/AppError.js";
import { ZodError } from "zod";
import { Prisma } from "@prisma/client";

export function errorHandler(
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction,
) {
  if (error instanceof AppError && error.statusCode < 500) {
    return res.status(error.statusCode).json({
      message: error.message,
      code: error.code,
    });
  }

  if (error instanceof ZodError) {
    return res.status(400).json({
      code: "VALIDATION_ERROR",
      errors: error.issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message,
      })),
    });
  }

  if (
    error instanceof Prisma.PrismaClientKnownRequestError ||
    error instanceof Prisma.PrismaClientInitializationError ||
    error instanceof Prisma.PrismaClientUnknownRequestError ||
    error instanceof Prisma.PrismaClientValidationError ||
    error instanceof Prisma.PrismaClientRustPanicError
  ) {
    console.error("Internal database error:", {
      timestamp: new Date().toISOString(),
      method: req.method,
      route: req.route?.path,
      errorType: error.name,
      code: "code" in error ? error.code : "errorCode" in error ? error.errorCode : undefined,
    });
  } else {
    console.error("Internal Error:", error);
  }

  return res.status(500).json({
    code: "INTERNAL_ERROR",
    message: "Internal server error",
  });
}
