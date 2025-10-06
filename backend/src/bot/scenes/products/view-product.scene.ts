// @ts-nocheck
import { Scenes } from "telegraf";
import { productService } from "../../../services/products/product.service";
import { productKeyboards } from "../../keyboards/product.keyboards";
import logger from "../../../utils/logger";

export const viewProductScene = new Scenes.BaseScene<Scenes.SceneContext>(
  "VIEW_PRODUCT"
);

// Scene enter handler - expects sku as scene state
viewProductScene.enter(async (ctx) => {
  // Get SKU from scene state
  const sku = ctx.scene.state.sku;
  if (!sku) {
    await ctx.reply("❌ Product SKU not provided.");
    return ctx.scene.leave();
  }

  await showProductDetails(ctx, sku);
});

// Close action
viewProductScene.action("product:close", async (ctx) => {
  await ctx.answerCbQuery();
  await ctx.deleteMessage();
  await ctx.scene.leave();
});

// Helper function to show product details
async function showProductDetails(ctx: Scenes.SceneContext, sku: string) {
  try {
    const product = await productService.getProductBySku(sku);
    if (!product) {
      await ctx.reply(`❌ Product with SKU "${sku}" not found.`);
      return ctx.scene.leave();
    }

    const message = productService.formatProductDetails(product);

    if (ctx.callbackQuery) {
      await ctx.editMessageText(message, {
        parse_mode: "Markdown",
        ...productKeyboards.createProductDetailsKeyboard(sku),
      });
    } else {
      await ctx.reply(message, {
        parse_mode: "Markdown",
        ...productKeyboards.createProductDetailsKeyboard(sku),
      });
    }
  } catch (error) {
    logger.error("Error fetching product:", error);
    await ctx.reply("❌ Failed to fetch product details. Please try again.");
    await ctx.scene.leave();
  }
}
