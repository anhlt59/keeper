import path from "node:path";
import { config } from "dotenv";
import { defineConfig, env } from "prisma/config";

// Load .env first, then .env.local as override
config();
config({ path: path.resolve(__dirname, ".env.local") });

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url: env("DATABASE_URL"),
  },
});
