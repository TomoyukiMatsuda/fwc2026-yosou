import type { GroupId, TeamId } from "@/domain/types";
import { GROUP_IDS } from "@/domain/types";
import { GROUPS } from "./groups";

// ============================================================================
// グループステージ最終順位の確定データ（決勝トーナメント予想モードの起点）
//
// 出典: Wikipedia "2026 FIFA World Cup knockout stage" / NBC Sports full standings。
// 調査・照合日: 2026-06-28（グループステージ全日程終了・2独立ソースで相互照合済み）。
//
// このアプリの「真実」は groupRankings / thirdPlaceQualifiers / knockoutPicks の3つ。
// グループ順位はもう確定事実なので、前2者を確定値で固定し、ユーザーには
// knockoutPicks（勝ち上がり予想）だけを操作させる。R32〜決勝の対戦カードは
// 既存の派生エンジン（resolveBracket / 公式Annex C表）がこの確定値から再現する。
//
// TeamId は teams.ts 準拠（FIFA式3文字コード）。順位は [1位,2位,3位,4位]。
// ============================================================================

/** 各グループの最終順位 [1位,2位,3位,4位]（確定値・編集不可） */
export const CONFIRMED_GROUP_RANKINGS: Record<GroupId, TeamId[]> = {
  A: ["MEX", "RSA", "KOR", "CZE"],
  B: ["SUI", "CAN", "BIH", "QAT"],
  C: ["BRA", "MAR", "SCO", "HAI"],
  D: ["USA", "AUS", "PAR", "TUR"],
  E: ["GER", "CIV", "ECU", "CUW"],
  F: ["NED", "JPN", "SWE", "TUN"],
  G: ["BEL", "EGY", "IRN", "NZL"],
  H: ["ESP", "CPV", "URU", "KSA"],
  I: ["FRA", "NOR", "SEN", "IRQ"],
  J: ["ARG", "AUT", "ALG", "JOR"],
  K: ["COL", "POR", "COD", "UZB"],
  L: ["ENG", "CRO", "GHA", "PAN"],
};

/**
 * 3位通過する8グループ（確定値）。
 * この8組を公式Annex C表に通すと R32 の3位スロット割当が実際の大会と一致する。
 */
export const CONFIRMED_THIRD_QUALIFIERS: GroupId[] = [
  "B", "D", "E", "F", "I", "J", "K", "L",
];

// --- 起動時ドリフト検算（groups.ts と同じ思想）---
// 各組の確定順位が GROUPS[g]（抽選で確定した4チーム）の並べ替えになっているか検査。
// 手入力ミス（チーム取り違え・重複・別組混入）を構造的に弾く。
for (const g of GROUP_IDS) {
  const ranking = CONFIRMED_GROUP_RANKINGS[g];
  if (!ranking || ranking.length !== 4) {
    throw new Error(`CONFIRMED_GROUP_RANKINGS[${g}] は4チームである必要があります`);
  }
  const expected = new Set(GROUPS[g]);
  const seen = new Set<TeamId>();
  for (const id of ranking) {
    if (!expected.has(id) || seen.has(id)) {
      throw new Error(
        `CONFIRMED_GROUP_RANKINGS[${g}] が グループ${g} の構成と不一致です（${id}）`,
      );
    }
    seen.add(id);
  }
}

if (CONFIRMED_THIRD_QUALIFIERS.length !== 8) {
  throw new Error(
    `CONFIRMED_THIRD_QUALIFIERS は8グループである必要があります（現在 ${CONFIRMED_THIRD_QUALIFIERS.length}）`,
  );
}
