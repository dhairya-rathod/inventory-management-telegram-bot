import express from "express";
import "express-async-errors";
import cors from "cors";
import helmet from "helmet";
import config from "./config";
import logger from "./utils/logger";
import { testConnection } from "./database/supabase.client";
import bot from "./bot/bot";
import {
  notFoundMiddleware,
  errorHandlerMiddleware,
} from "./utils/error-handler";

const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// API routes will go here
// Example: app.use('/api/v1', apiRoutes);

// Error handling
app.use(notFoundMiddleware);
app.use(errorHandlerMiddleware);

// Initialize application
const startApp = async () => {
  try {
    logger.info("Starting Stock Management Bot...");

    // Test database connection
    const dbConnected = await testConnection();
    if (!dbConnected) {
      throw new Error("Failed to connect to database");
    }

    // Start Telegram bot
    logger.info("Initializing Telegram bot...");
    bot
      .launch()
      .then(() => {
        logger.info("✅ Telegram bot started successfully");
      })
      .catch((err) => {
        logger.error("🚫 Failed to launch Telegram bot", err);
        process.exit(1);
      });

    // Start Express server
    app.listen(config.server.port, () => {
      logger.info(`✅ Server running on port ${config.server.port}`);
      logger.info(`Environment: ${config.server.env}`);
    });

    // Graceful shutdown
    process.once("SIGINT", () => {
      logger.info("Received SIGINT, shutting down gracefully...");
      bot.stop("SIGINT");
      process.exit(0);
    });

    process.once("SIGTERM", () => {
      logger.info("Received SIGTERM, shutting down gracefully...");
      bot.stop("SIGTERM");
      process.exit(0);
    });
  } catch (error) {
    logger.error("Failed to start application", error);
    process.exit(1);
  }
};

startApp();
