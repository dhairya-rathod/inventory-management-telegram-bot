import { Telegraf, Scenes, session } from "telegraf";
import { BotContext } from "../types/bot.types";
import config from "../config";
import logger from "../utils/logger";
import { handleBotError } from "../utils/error-handler";
import {
  addProductWizard,
  listProductsScene,
  viewProductScene,
} from "./scenes/products";

// Initialize bot
const bot = new Telegraf<BotContext>(config.telegram.botToken);

// Session middleware
bot.use(session());

const stage = new Scenes.Stage([
  addProductWizard, // @ts-ignore
  listProductsScene, // @ts-ignore
  viewProductScene,
]);

// @ts-ignore
bot.use(stage.middleware());

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

// Products command
bot.command("addproduct", async (ctx) => {
  try {
    await ctx.scene.enter("ADD_PRODUCT_WIZARD");
  } catch (error) {
    console.log("TCL ~ error:", error);
    logger.error("Error entering add product scene:", error);
    await ctx.reply("❌ Failed to start product creation. Please try again.");
  }
});

bot.command("listproducts", async (ctx) => {
  try {
    await ctx.scene.enter("LIST_PRODUCTS");
  } catch (error) {
    logger.error("Error entering list products scene:", error);
    await ctx.reply("❌ Failed to fetch product list. Please try again.");
  }
});

bot.command("product", async (ctx) => {
  try {
    const sku = ctx.message.text.split(" ")[1];
    if (!sku) {
      await ctx.reply(
        "⚠️ Please provide a product SKU.\n" + "Usage: /product <sku>"
      );
      return;
    }

    await ctx.scene.enter("VIEW_PRODUCT", { sku });
  } catch (error) {
    logger.error("Error entering view product scene:", error);
    await ctx.reply("❌ Failed to fetch product details. Please try again.");
  }
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
