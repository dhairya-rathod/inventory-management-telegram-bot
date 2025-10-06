export interface Product {
  id: string;
  name: string;
  description: string | null;
  sku: string;
  unit_price: number;
  unit: string;
  category: string | null;
  image_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateProductDTO {
  name: string;
  description?: string;
  sku: string;
  unit_price: number;
  unit: string;
  category?: string;
  image_url?: string;
}

export interface UpdateProductDTO {
  name?: string;
  description?: string;
  unit_price?: number;
  unit?: string;
  category?: string;
  image_url?: string;
  is_active?: boolean;
}

export interface ProductWithInventory {
  id: string;
  name: string;
  description: string | null;
  sku: string;
  unit_price: number;
  selling_price: number;
  unit: string;
  category: string | null;
  image_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  inventory?: {
    quantity: number;
    min_stock_level: number | null;
    location: string | null;
  } | null;
}
