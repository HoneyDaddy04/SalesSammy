import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

export const config = {
  port: parseInt(process.env.PORT || "3001", 10),
  anthropicApiKey: process.env.ANTHROPIC_API_KEY || "",
  databasePath: process.env.DATABASE_PATH || "./data/vaigence.db",
  corsOrigin: process.env.CORS_ORIGIN || "http://localhost:8080",
  vaultKey: process.env.VAULT_KEY || "",
};
