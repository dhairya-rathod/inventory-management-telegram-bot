import { Telegraf } from "telegraf";
import config from "../config";
import logger from "../utils/logger";
import { handleBotError } from "../utils/error-handler";

// Initialize bot
console.log("TCL ~ config.telegram.botToken:", config.telegram.botToken);
const bot = new Telegraf(config.telegram.botToken);

// Error handling middleware
bot.catch((err, ctx) => {
  logger.error("Bot error:", err);
  handleBotError(err, ctx);
});

// Basic commands
bot.start(async (ctx) => {
  const firstName = ctx.from?.first_name || "there";
  await ctx.reply(
    `👋 Hello ${firstName}!\n\n` +
      `Welcome to Stock Management Bot.\n\n` +
      `Use /help to see available commands.`
  );
});

bot.help(async (ctx) => {
  const helpMessage = `
📦 *Stock Management Bot - Commands*

*Product Management:*
/addproduct - Add a new product
/listproducts - View all products
/product [sku] - View product details

*Stock Operations:*
/stockin [sku] [qty] - Add stock
/stockout [sku] [qty] - Remove stock
/stock [sku] - Check stock level
/allstock - View all inventory

*Reports:*
/report - Generate reports
/lowstock - View low stock items

*Help:*
/help - Show this message

More commands coming soon! 🚀
  `;

  await ctx.reply(helpMessage, { parse_mode: "Markdown" });
});

// Test command
bot.command("ping", async (ctx) => {
  await ctx.reply("🏓 Pong!");
});

// Log all incoming messages in development
if (config.server.env === "development") {
  bot.use(async (ctx, next) => {
    logger.debug("Incoming update:", {
      update_id: ctx.update.update_id,
      message: ctx.message,
      from: ctx.from,
    });
    await next();
  });
}

export default bot;
