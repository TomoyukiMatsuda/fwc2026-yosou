import { drizzle } from "drizzle-orm/d1";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import * as schema from "./schema";

// ============================================================================
// Drizzle/D1 クライアント
//
// getCloudflareContext() は必ずリクエストスコープ内で呼ぶ（トップレベルI/O禁止）。
// getDb() も各リクエスト/レンダー内で都度呼ぶこと。
// ============================================================================

export function getDb() {
  const { env } = getCloudflareContext();
  return drizzle(env.DB, { schema });
}
