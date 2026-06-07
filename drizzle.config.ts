import { defineConfig } from "drizzle-kit";

// マイグレーションSQLを ./drizzle に生成 → `wrangler d1 migrations apply` で適用する。
// （drizzle-kit migrate/push は使わず、適用は wrangler に任せる構成）
export default defineConfig({
  dialect: "sqlite",
  schema: "./src/db/schema.ts",
  out: "./drizzle",
});
