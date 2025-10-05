import { ErrorRequestHandler, RequestHandler } from "express";
import { ZodError } from "zod";
import { Context } from "telegraf";
import logger from "./logger";

export class CustomError extends Error {
  constructor(
    public statusCode: number,
    message: string
  ) {
    super(message);
    this.name = "CustomError";
  }
}

export class NotFoundError extends CustomError {
  constructor(message = "Resource not found") {
    super(404, message);
    this.name = "NotFoundError";
  }
}

export class UnauthorizedError extends CustomError {
  constructor(message = "Unauthorized access") {
    super(401, message);
    this.name = "UnauthorizedError";
  }
}

export class BadRequestError extends CustomError {
  constructor(message = "Bad request") {
    super(400, message);
    this.name = "BadRequestError";
  }
}

// Not found middleware for undefined routes
export const notFoundMiddleware: RequestHandler = (req, _res, next) => {
  next(new NotFoundError(`Route ${req.method} ${req.url} not found`));
};

// Global error handler middleware
export const errorHandlerMiddleware: ErrorRequestHandler = (
  err,
  _req,
  res,
  _next
) => {
  let statusCode = 500;
  let message = "Internal Server Error";
  let errors: any = undefined;

  // Handle known errors
  if (err instanceof CustomError) {
    statusCode = err.statusCode;
    message = err.message;
  }
  // Handle Zod validation errors
  else if (err instanceof ZodError) {
    statusCode = 400;
    message = "Validation Error";
    errors = err.errors.map((error) => ({
      field: error.path.join("."),
      message: error.message,
    }));
  }
  // Handle Supabase errors
  else if (err?.name === "PostgrestError") {
    statusCode = err.code === "PGRST116" ? 404 : 400;
    message = err.message || "Database Error";
  }

  // Log error in development
  if (process.env.NODE_ENV === "development") {
    console.error(err);
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(errors && { errors }),
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
};

// Handle Telegram bot errors
export const handleBotError = async (error: any, ctx: Context) => {
  logger.error("Bot Error:", {
    error: error.message,
    update: ctx.update,
    chat: ctx.chat,
    user: ctx.from,
  });

  let errorMessage = "❌ An error occurred while processing your request.";

  if (error instanceof CustomError) {
    errorMessage = `❌ ${error.message}`;
  } else if (error instanceof ZodError) {
    errorMessage = "❌ Invalid input format. Please check your command format.";
  } else if (error?.name === "PostgrestError") {
    errorMessage = "❌ Database operation failed. Please try again later.";
  }

  try {
    // Send error message to user
    await ctx.reply(errorMessage);
  } catch (replyError) {
    logger.error("Failed to send error message to user:", replyError);
  }
};
