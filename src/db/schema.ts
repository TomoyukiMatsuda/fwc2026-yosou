import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import type { SharedPayloadV1 } from "@/domain/prediction/serialize";

// ============================================================================
// D1 (SQLite) スキーマ（Drizzle）
//
// 予想本体はJSON 1カラム + ランキング/採点用に非正規化カラム少数。
// 部分検索要件がないので正規化は過剰 → JSON保持。
// SQLiteに datetime 型は無い → integer({mode:'timestamp_ms'})。
// ============================================================================

export const predictions = sqliteTable(
  "predictions",
  {
    /** 共有ID（nanoid 10文字・紛らわしい文字除外） */
    id: text("id").primaryKey(),
    /** 任意のニックネーム（識別/将来のランキング表示用） */
    nickname: text("nickname"),
    /** 予想の真実（JSON）。挿入前に必ず zod 検証する */
    payload: text("payload", { mode: "json" })
      .$type<SharedPayloadV1>()
      .notNull(),
    /** 優勝チームID（非正規化＝一覧/採点高速化） */
    championTeamId: text("champion_team_id").notNull(),
    /** 採点結果（M4で更新。未採点は null） */
    score: integer("score"),
    /** 採点日時 */
    scoredAt: integer("scored_at", { mode: "timestamp_ms" }),
    /** 作成日時（DB依存を避け $defaultFn で打刻） */
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .$defaultFn(() => new Date())
      .notNull(),
  },
  (t) => [index("idx_pred_score").on(t.score)],
);

export type PredictionRow = typeof predictions.$inferSelect;
export type NewPredictionRow = typeof predictions.$inferInsert;
