import { Scenes } from "telegraf";
import { productService } from "../../../services/products/product.service";
import { productKeyboards } from "../../keyboards/product.keyboards";
import logger from "../../../utils/logger";

const PRODUCTS_PER_PAGE = 5;

export const listProductsScene = new Scenes.BaseScene<Scenes.SceneContext>(
  "LIST_PRODUCTS"
);

// Scene enter handler
listProductsScene.enter(async (ctx) => {
  await showProductList(ctx, 1);
});

// Action handlers for pagination
listProductsScene.action(/^products:page:(\d+)$/, async (ctx) => {
  const page = parseInt(ctx.match[1]);
  await ctx.answerCbQuery();
  await showProductList(ctx, page);
});

// Close action
listProductsScene.action("products:close", async (ctx) => {
  await ctx.answerCbQuery();
  await ctx.deleteMessage();
  await ctx.scene.leave();
});

// Helper function to show product list
async function showProductList(ctx: Scenes.SceneContext, page: number) {
  try {
    const { products, total } = await productService.listProducts(
      page,
      PRODUCTS_PER_PAGE
    );
    const totalPages = Math.ceil(total / PRODUCTS_PER_PAGE);

    if (products.length === 0) {
      await ctx.reply("No products found.");
      return ctx.scene.leave();
    }

    const message = formatProductList(products, page, totalPages);

    // If it's a new message, send new, otherwise edit
    if (ctx.callbackQuery) {
      await ctx.editMessageText(message, {
        parse_mode: "Markdown",
        ...productKeyboards.createListingKeyboard(page, totalPages),
      });
    } else {
      await ctx.reply(message, {
        parse_mode: "Markdown",
        ...productKeyboards.createListingKeyboard(page, totalPages),
      });
    }
  } catch (error) {
    logger.error("Error fetching products:", error);
    await ctx.reply("❌ Failed to fetch products. Please try again.");
    await ctx.scene.leave();
  }
}

function formatProductList(
  products: any[],
  currentPage: number,
  totalPages: number
): string {
  const header = `📋 *Product List* (Page ${currentPage}/${totalPages})\n\n`;

  const productList = products
    .map((p, index) => {
      const stockStatus =
        p.inventory?.quantity <= p.inventory?.min_stock_level
          ? "⚠️ Low Stock!"
          : p.inventory?.quantity === 0
            ? "❌ Out of Stock!"
            : "✅ In Stock";

      return `${index + 1}. *${p.name}*
SKU: \`${p.sku}\`
Price: ₹${p.selling_price}/${p.unit}
Stock: ${p.inventory?.quantity || 0} ${p.unit} - ${stockStatus}
`;
    })
    .join("\n");

  return header + productList;
}
