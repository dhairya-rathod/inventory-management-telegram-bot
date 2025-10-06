import { supabase } from "../supabase.client";
import {
  CreateProductDTO,
  Product,
  ProductWithInventory,
} from "../../types/product.types";

export const productQueries = {
  async createProduct(product: CreateProductDTO): Promise<Product> {
    const { data, error } = await supabase
      .from("products")
      .insert(product)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getProductBySku(sku: string): Promise<ProductWithInventory | null> {
    const { data, error } = await supabase
      .from("products")
      .select(
        `
                *,
                inventory (
                    quantity,
                    min_stock_level,
                    location
                )
            `
      )
      .eq("sku", sku)
      .single();

    if (error) throw error;
    return data;
  },

  async listProducts(
    page: number = 1,
    limit: number = 10
  ): Promise<{
    products: ProductWithInventory[];
    total: number;
  }> {
    const start = (page - 1) * limit;
    const end = start + limit - 1;

    const {
      data: products,
      error,
      count,
    } = await supabase
      .from("products")
      .select(
        `
                *,
                inventory (
                    quantity,
                    min_stock_level,
                    location
                )
            `,
        { count: "exact" }
      )
      .order("name")
      .range(start, end);

    if (error) throw error;
    return { products, total: count || 0 };
  },

  async searchProducts(query: string): Promise<ProductWithInventory[]> {
    const { data, error } = await supabase
      .from("products")
      .select(
        `
                *,
                inventory (
                    quantity,
                    min_stock_level,
                    location
                )
            `
      )
      .or(`name.ilike.%${query}%,sku.ilike.%${query}%`)
      .limit(10);

    if (error) throw error;
    return data || [];
  },
};
