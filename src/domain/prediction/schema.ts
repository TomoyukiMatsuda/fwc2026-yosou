import { z } from "zod";
import { GROUP_IDS, type GroupId } from "@/domain/types";
import { GROUPS } from "@/domain/data/groups";
import { TEAMS } from "@/domain/data/teams";
import { ALL_MATCH_IDS } from "@/domain/bracket/r32-template";
import type { SharedPayloadV1 } from "./serialize";
import { fromSharedPayload } from "./serialize";
import { getBracket, isPredictionComplete } from "./selectors";
import { THIRD_PLACE_LIMIT } from "./types";

// ============================================================================
// 外部から来る共有ペイロードの検証（zod構造検証 + 意味的整合検証）
//
// D1 はJSON中身を検証しない → insert前に必ずここを通す。
// 構造だけでなく「実在チーム・完成した整合ブラケット」まで保証する。
// ============================================================================

/** 構造レベルのzodスキーマ（型の形だけ） */
export const sharedPayloadSchema = z.object({
  schemaVersion: z.literal(1),
  groupRankings: z.record(z.string(), z.array(z.string())),
  thirdPlaceQualifiers: z.array(z.string()),
  knockoutPicks: z.record(z.string(), z.string()),
});

export type ValidationResult =
  | { ok: true; payload: SharedPayloadV1 }
  | { ok: false; error: string };

const GROUP_ID_SET = new Set<string>(GROUP_IDS);

/**
 * 共有ペイロードを検証し、正規化済みの SharedPayloadV1 を返す。
 * 不正なら ok:false とエラー理由。
 */
export function validateSharedPayload(input: unknown): ValidationResult {
  const parsed = sharedPayloadSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "ペイロードの形式が不正です" };
  }
  const data = parsed.data;

  // --- groupRankings: 全12グループ・各4チーム・そのグループ所属の並び替え ---
  const groupRankings: Record<GroupId, string[]> = {} as Record<
    GroupId,
    string[]
  >;
  for (const g of GROUP_IDS) {
    const order = data.groupRankings[g];
    if (!order || order.length !== 4) {
      return { ok: false, error: `グループ${g}の順位が不正です` };
    }
    const expected = new Set(GROUPS[g]);
    const seen = new Set<string>();
    for (const id of order) {
      if (!expected.has(id) || seen.has(id)) {
        return { ok: false, error: `グループ${g}の構成が不正です` };
      }
      seen.add(id);
    }
    groupRankings[g] = order;
  }
  // 余計なキーが無いか
  for (const key of Object.keys(data.groupRankings)) {
    if (!GROUP_ID_SET.has(key)) {
      return { ok: false, error: `未知のグループ ${key}` };
    }
  }

  // --- thirdPlaceQualifiers: ちょうど8・ユニーク・実在グループ ---
  const thirds = data.thirdPlaceQualifiers;
  if (thirds.length !== THIRD_PLACE_LIMIT) {
    return { ok: false, error: "3位通過は8グループ必要です" };
  }
  const thirdSet = new Set<string>();
  for (const g of thirds) {
    if (!GROUP_ID_SET.has(g) || thirdSet.has(g)) {
      return { ok: false, error: "3位通過グループが不正です" };
    }
    thirdSet.add(g);
  }

  // --- knockoutPicks: キーは32試合すべて・値は実在チーム ---
  const pickKeys = Object.keys(data.knockoutPicks);
  if (pickKeys.length !== ALL_MATCH_IDS.length) {
    return { ok: false, error: "ノックアウトの予想が未完成です" };
  }
  for (const id of ALL_MATCH_IDS) {
    const team = data.knockoutPicks[String(id)];
    if (!team || !TEAMS[team]) {
      return { ok: false, error: `試合${id}の勝者が不正です` };
    }
  }
  const knockoutPicks: Record<number, string> = {};
  for (const [k, v] of Object.entries(data.knockoutPicks)) {
    knockoutPicks[Number(k)] = v;
  }

  const payload: SharedPayloadV1 = {
    schemaVersion: 1,
    groupRankings: groupRankings as Record<GroupId, string[]>,
    thirdPlaceQualifiers: thirds as GroupId[],
    knockoutPicks,
  };

  // --- 意味的整合: 再解決して「完成した整合ブラケット」か最終確認 ---
  const state = fromSharedPayload(payload);
  const bracket = getBracket(state);
  if (!isPredictionComplete(state, bracket)) {
    return { ok: false, error: "予想が整合していないか未完成です" };
  }

  return { ok: true, payload };
}
