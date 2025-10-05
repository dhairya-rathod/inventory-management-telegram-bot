import { createClient } from "@supabase/supabase-js";
import config from "../config";

// Create Supabase client with service role key for admin operations
export const supabase = createClient(
  config.supabase.url,
  config.supabase.serviceRoleKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

// Test database connection
export const testConnection = async (): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .schema("public")
      .from("users")
      .select("count")
      .limit(1);
    if (error) {
      console.error("Database connection test failed:", error.message);
      return false;
    }
    console.log("✅ Database connection successful");
    return true;
  } catch (error) {
    console.error("Database connection test error:", error);
    return false;
  }
};

export default supabase;
