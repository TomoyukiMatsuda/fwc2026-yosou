// Cloudflare バインディングの型定義。
// `npm run cf-typegen` (wrangler types) で再生成も可能だが、
// D1 バインディングは手動定義しておき型チェックを常に通す。
import type { D1Database } from "@cloudflare/workers-types";

declare global {
  interface CloudflareEnv {
    DB: D1Database;
  }
}

export {};
