// @ts-nocheck
import { Markup, Scenes } from "telegraf";
import { productService } from "../../../services/products/product.service";
import { CreateProductDTO } from "../../../types/product.types";
import logger from "../../../utils/logger";

const { WizardScene } = Scenes;

const validatePrice = (price: string): number | null => {
  const parsedPrice = parseFloat(price);
  return !isNaN(parsedPrice) && parsedPrice >= 0 ? parsedPrice : null;
};

const validateSku = (sku: string): boolean => {
  return /^[A-Za-z0-9-_]+$/.test(sku);
};

export const addProductWizard = new WizardScene<Scenes.WizardContext>(
  "ADD_PRODUCT_WIZARD",
  // Step 1: Initial message
  async (ctx) => {
    await ctx.reply("🆕 *Add New Product*\n\nPlease enter product name:", {
      parse_mode: "Markdown",
      reply_markup: { force_reply: true },
    });
    return ctx.wizard.next();
  },

  // Step 2: Product Name & Description
  async (ctx) => {
    if (!ctx.message || !("text" in ctx.message)) {
      await ctx.reply("⚠️ Please enter a valid product name.");
      return;
    }

    ctx.wizard.state.product = {
      name: ctx.message.text,
    } as Partial<CreateProductDTO>;
    await ctx.reply(
      '📝 Enter product description (or type "-" to skip):',
      Markup.forceReply().oneTime()
    );
    return ctx.wizard.next();
  },

  // Step 3: SKU
  async (ctx) => {
    if (!ctx.message || !("text" in ctx.message)) {
      await ctx.reply("⚠️ Please enter a valid description.");
      return;
    }

    const description = ctx.message.text === "-" ? null : ctx.message.text;
    ctx.wizard.state.product.description = description;

    await ctx.reply(
      "🏷️ Enter product SKU (unique identifier, alphanumeric):",
      Markup.forceReply().oneTime()
    );
    return ctx.wizard.next();
  },

  // Step 4: Unit Price
  async (ctx) => {
    if (!ctx.message || !("text" in ctx.message)) {
      await ctx.reply("⚠️ Please enter a valid SKU.");
      return;
    }

    const sku = ctx.message.text.trim();
    if (!validateSku(sku)) {
      await ctx.reply(
        "⚠️ Invalid SKU format. Use only letters, numbers, and dashes."
      );
      return;
    }

    try {
      const existingProduct = await productService.getProductBySku(sku);
      if (existingProduct) {
        await ctx.reply("⚠️ This SKU already exists. Please choose a different one.");
        return;
      }
    } catch (error) {
      logger.error('Error checking SKU:', error);
    }

    ctx.wizard.state.product.sku = sku;
    await ctx.reply(
      "💰 Enter unit price (purchase cost):",
      Markup.forceReply().oneTime()
    );
    return ctx.wizard.next();
  },

  // Step 5: Selling Price
  async (ctx) => {
    if (!ctx.message || !("text" in ctx.message)) {
      await ctx.reply("⚠️ Please enter a valid price.");
      return;
    }

    const price = validatePrice(ctx.message.text);
    if (price === null) {
      await ctx.reply("⚠️ Invalid price. Please enter a valid number.");
      return;
    }

    ctx.wizard.state.product.unit_price = price;
    await ctx.reply("💵 Enter selling price:", Markup.forceReply().oneTime());
    return ctx.wizard.next();
  },

  // Step 6: Unit
  async (ctx) => {
    if (!ctx.message || !("text" in ctx.message)) {
      await ctx.reply("⚠️ Please enter a valid price.");
      return;
    }

    const price = validatePrice(ctx.message.text);
    if (price === null) {
      await ctx.reply("⚠️ Invalid price. Please enter a valid number.");
      return;
    }
    if (price < ctx.wizard.state.product.unit_price) {
      await ctx.reply("⚠️ Selling price cannot be less than unit price.");
      return;
    }

    ctx.wizard.state.product.selling_price = price;
    await ctx.reply(
      "📏 Enter unit (e.g., pcs, kg, box):",
      Markup.forceReply().oneTime()
    );
    return ctx.wizard.next();
  },

  // Step 7: Category
  async (ctx) => {
    if (!ctx.message || !("text" in ctx.message)) {
      await ctx.reply("⚠️ Please enter a valid unit.");
      return;
    }

    ctx.wizard.state.product.unit = ctx.message.text;
    await ctx.reply(
      '📁 Enter category (or "-" to skip):',
      Markup.forceReply().oneTime()
    );
    return ctx.wizard.next();
  },

  // Step 8: Image
  async (ctx) => {
    if (!ctx.message || !("text" in ctx.message)) {
      await ctx.reply("⚠️ Please enter a valid category.");
      return;
    }

    const category = ctx.message.text === "-" ? null : ctx.message.text;
    ctx.wizard.state.product.category = category;

    await ctx.reply(
      '🖼️ Send product image or type "-" to skip:',
      Markup.forceReply().oneTime()
    );
    return ctx.wizard.next();
  },

  // Step 9: Save Product
  async (ctx) => {
    let imageUrl = null;

    if (ctx.message) {
      if ("photo" in ctx.message && ctx.message.photo) {
        const fileId = ctx.message.photo.pop()?.file_id;
        if (fileId) {
          try {
            const file = await ctx.telegram.getFile(fileId);
            imageUrl = `https://api.telegram.org/file/bot${ctx.botInfo.token}/${file.file_path}`;
          } catch (error) {
            logger.error("Error uploading image:", error);
            await ctx.reply(
              "⚠️ Failed to upload image. Continuing without image..."
            );
          }
        }
      } else if (!("text" in ctx.message) || ctx.message.text !== "-") {
        await ctx.reply("⚠️ Please send an image or type '-' to skip.");
        return;
      }
    }

    ctx.wizard.state.product.image_url = imageUrl;

    try {
      // Save to database
      const savedProduct = await productService.createProduct(ctx.wizard.state.product as CreateProductDTO);

      // Send success message with product details
      await ctx.reply(
        "✅ *Product Added Successfully!*\n\n" +
        productService.formatProductDetails({
          ...savedProduct,
          inventory: { quantity: 0 }
        }),
        {
          parse_mode: "Markdown",
          reply_markup: Markup.inlineKeyboard([
            [Markup.button.callback('📦 Add Stock', `stock:add:${savedProduct.sku}`)]
          ])
        }
      );
      await ctx.reply("✅ Product added successfully!");
    } catch (error) {
      logger.error("Error saving product:", error);
      await ctx.reply(
        "❌ Failed to save product. Please try again or contact support."
      );
    }

    return ctx.scene.leave();
  }
);
