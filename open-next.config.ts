import { defineCloudflareConfig } from "@opennextjs/cloudflare";

// 最小構成。ISR/キャッシュは未使用なので incrementalCache 等は設定しない
// （R2 等の追加リソース不要 = 完全無料枠で完結）。
export default defineCloudflareConfig({});
