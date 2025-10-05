import express from 'express';
import dotenv from 'dotenv';
import { bot, initBot } from './bot/bot';
import { setupRoutes } from './api/routes';
import { config } from './config';

dotenv.config();

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS setup for frontend
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', config.frontend.url);
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  next();
});

// Setup routes
setupRoutes(app);

// Webhook endpoint for production
if (config.nodeEnv === 'production') {
  app.post('/webhook', (req, res) => {
    bot.handleUpdate(req.body, res);
  });
}

// Start server
app.listen(config.port, async () => {
  console.log(`Server is running on port ${config.port}`);
  await initBot();
});
