import { Telegraf } from 'telegraf';
import { config } from '../config';
import { setupCommands } from './commands';
import { setupMessageHandlers } from './handlers/message.handler';
import { setupCallbackHandlers } from './handlers/callback.handler';
import { authMiddleware } from './middlewares/auth.middleware';
import { errorMiddleware } from './middlewares/error.middleware';

export const bot = new Telegraf(config.bot.token);

// Middleware
bot.use(authMiddleware);
bot.use(errorMiddleware);

// Setup handlers
setupCommands(bot);
setupMessageHandlers(bot);
setupCallbackHandlers(bot);

// Error handling
bot.catch((err: Error) => {
  console.error('Telegraf error:', err);
});

export const initBot = async () => {
  if (config.nodeEnv === 'production' && config.bot.webhookDomain) {
    // Setup webhook in production
    const webhookUrl = `${config.bot.webhookDomain}/webhook`;
    await bot.telegram.setWebhook(webhookUrl);
    console.log('Bot webhook set:', webhookUrl);
  } else {
    // Use polling in development
    await bot.launch();
    console.log('Bot started in polling mode');
  }
};
