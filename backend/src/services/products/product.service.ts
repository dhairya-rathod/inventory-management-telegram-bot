import {
  CreateProductDTO,
  Product,
  ProductWithInventory,
} from "../../types/product.types";
import { productQueries } from "../../database/queries/product.queries";
import logger from "../../utils/logger";

export const productService = {
  async createProduct(productData: CreateProductDTO): Promise<Product> {
    try {
      return await productQueries.createProduct(productData);
    } catch (error) {
      logger.error("Error creating product:", error);
      throw error;
    }
  },

  async getProductBySku(sku: string): Promise<ProductWithInventory | null> {
    try {
      return await productQueries.getProductBySku(sku);
    } catch (error) {
      logger.error("Error fetching product:", error);
      throw error;
    }
  },

  async listProducts(page: number = 1, limit: number = 10) {
    try {
      return await productQueries.listProducts(page, limit);
    } catch (error) {
      logger.error("Error listing products:", error);
      throw error;
    }
  },

  async searchProducts(query: string) {
    try {
      return await productQueries.searchProducts(query);
    } catch (error) {
      logger.error("Error searching products:", error);
      throw error;
    }
  },

  formatProductDetails(product: ProductWithInventory): string {
    return `
📦 *${product.name}*
SKU: \`${product.sku}\`
Description: ${product.description || "N/A"}
Category: ${product.category || "N/A"}
Unit: ${product.unit}

💰 *Pricing*
Cost: ₹${product.unit_price}
Selling Price: ₹${product.selling_price}

📊 *Stock Information*
Current Stock: ${product.inventory?.quantity || 0} ${product.unit}
Min Stock Level: ${product.inventory?.min_stock_level || "Not set"} ${product.unit}
Location: ${product.inventory?.location || "Not specified"}

${product.image_url ? "🖼 _Image available_" : ""}`;
  },
};
