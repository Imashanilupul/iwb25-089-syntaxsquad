import { Request, Response, NextFunction } from "express"
import { logger } from "../utils/logger"

export class AppError extends Error {
  statusCode: number
  status: string
  isOperational: boolean

  constructor(message: string, statusCode: number) {
    super(message)
    this.statusCode = statusCode
    this.status = `${statusCode}`.startsWith("4") ? "fail" : "error"
    this.isOperational = true

    Error.captureStackTrace(this, this.constructor)
  }
}

export const errorHandler = (err: Error, req: Request, res: Response, next: NextFunction) => {
  let error = { ...err }
  error.message = err.message

  // Log error
  logger.error("Error caught by error handler:", {
    message: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
  })

  // Default error
  let statusCode = 500
  let message = "Internal server error"

  // Operational error
  if (error instanceof AppError) {
    statusCode = error.statusCode
    message = error.message
  }

  // Validation error
  if (err.name === "ValidationError") {
    statusCode = 400
    message = "Invalid input data"
  }

  // JWT error
  if (err.name === "JsonWebTokenError") {
    statusCode = 401
    message = "Invalid token"
  }

  // JWT expired error
  if (err.name === "TokenExpiredError") {
    statusCode = 401
    message = "Token expired"
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  })
}
