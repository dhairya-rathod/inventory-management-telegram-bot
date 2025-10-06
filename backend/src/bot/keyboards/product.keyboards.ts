import { Markup } from "telegraf";

export const productKeyboards = {
  createListingKeyboard(currentPage: number, totalPages: number) {
    const buttons = [];

    // Navigation buttons
    const navigationRow = [];
    if (currentPage > 1) {
      navigationRow.push(
        Markup.button.callback(
          "⬅️ Previous",
          `products:page:${currentPage - 1}`
        )
      );
    }
    if (currentPage < totalPages) {
      navigationRow.push(
        Markup.button.callback("Next ➡️", `products:page:${currentPage + 1}`)
      );
    }
    if (navigationRow.length > 0) {
      buttons.push(navigationRow);
    }

    // Add refresh and close buttons
    buttons.push([
      Markup.button.callback("🔄 Refresh", `products:page:${currentPage}`),
      Markup.button.callback("❌ Close", "products:close"),
    ]);

    return Markup.inlineKeyboard(buttons);
  },

  createProductDetailsKeyboard(sku: string) {
    return Markup.inlineKeyboard([
      [
        Markup.button.callback("📦 Update Stock", `stock:update:${sku}`),
        Markup.button.callback("✏️ Edit", `product:edit:${sku}`),
      ],
      [Markup.button.callback("❌ Close", "product:close")],
    ]);
  },
};
