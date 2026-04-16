import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

export const config = {
  port: parseInt(process.env.PORT || "3001", 10),
  anthropicApiKey: process.env.ANTHROPIC_API_KEY || "",
  databaseUrl: process.env.DATABASE_URL || "",
  corsOrigin: process.env.CORS_ORIGIN || "http://localhost:8080",
  vaultKey: process.env.VAULT_KEY || "",
  paystackSecretKey: process.env.PAYSTACK_SECRET_KEY || "",
  supabaseUrl: process.env.SUPABASE_URL || "",
  supabaseAnonKey: process.env.SUPABASE_ANON_KEY || "",
  openaiApiKey: process.env.OPENAI_API_KEY || "",
};
