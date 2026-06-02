import type { Request, Response, NextFunction } from "express";
import { AppError } from "../errors/AppError.js";
import { ZodError } from "zod";

export function errorHandler(
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction,
) {
  if (error instanceof AppError) {
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

  console.error("Internal Error:", error);

  return res.status(500).json({
    code: "INTERNAL_ERROR",
    message: error.message || "Internal server error",
  });
}
