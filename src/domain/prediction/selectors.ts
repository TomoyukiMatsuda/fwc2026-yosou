import type { GroupId, TeamId } from "@/domain/types";
import { GROUP_IDS } from "@/domain/types";
import {
  assignThirdPlaceSlots,
  type ThirdAssignment,
} from "@/domain/bracket/thirdPlace";
import {
  resolveBracket,
  type ResolvedBracket,
} from "@/domain/bracket/generateR32";
import {
  getFinalStandings,
  type FinalStandings,
} from "@/domain/bracket/advance";
import { MATCHES } from "@/domain/bracket/r32-template";
import type { PredictionState } from "./types";
import { THIRD_PLACE_LIMIT } from "./types";

// ============================================================================
// 派生セレクタ（純関数）。UI は getBracket(state) を useMemo し、
// bracket を受け取る関数群はその結果を渡して二重計算を避ける。
// ============================================================================

/** 3位通過グループ → R32スロット割当 */
export function getThirdAssignment(state: PredictionState): ThirdAssignment {
  return assignThirdPlaceSlots(state.thirdPlaceQualifiers);
}

/** 現在の状態からブラケット全体を解決（やや重いので呼び出し側で memo 推奨） */
export function getBracket(state: PredictionState): ResolvedBracket {
  return resolveBracket({
    groupRankings: state.groupRankings,
    thirdAssignment: getThirdAssignment(state),
    knockoutPicks: state.knockoutPicks,
  });
}

/** 順位確定済み（4チーム並んだ）グループ数 */
export function getRankedGroupCount(state: PredictionState): number {
  return GROUP_IDS.reduce(
    (n, g) => n + (state.groupRankings[g]?.length === 4 ? 1 : 0),
    0,
  );
}

/** 全12グループの順位が確定したか */
export function isGroupStageComplete(state: PredictionState): boolean {
  return getRankedGroupCount(state) === GROUP_IDS.length;
}

/** あるグループが順位確定済みか */
export function isGroupRanked(state: PredictionState, group: GroupId): boolean {
  return state.groupRankings[group]?.length === 4;
}

/** グループの3位チーム（未確定なら null） */
export function getGroupThirdTeam(
  state: PredictionState,
  group: GroupId,
): TeamId | null {
  return state.groupRankings[group]?.[2] ?? null;
}

/** 3位通過が定員(8)に達したか */
export function isThirdComplete(state: PredictionState): boolean {
  return state.thirdPlaceQualifiers.length === THIRD_PLACE_LIMIT;
}

/** ノックアウトが全試合決着済み（=ベスト4まで確定）か */
export function isKnockoutComplete(bracket: ResolvedBracket): boolean {
  return MATCHES.every((m) => bracket.get(m.id)?.winner != null);
}

/** ベスト4（優勝/準優勝/3位/4位） */
export function getStandings(bracket: ResolvedBracket): FinalStandings {
  return getFinalStandings(bracket);
}

/** まだ勝者未選択で、かつ両チーム揃っている次の試合ID（ウィザード誘導用） */
export function getNextOpenMatchId(bracket: ResolvedBracket): number | null {
  for (const m of MATCHES) {
    const r = bracket.get(m.id);
    if (r && r.ready && r.winner == null) return m.id;
  }
  return null;
}

/** ノックアウトで決着済みの試合数 / 全試合数 */
export function getKnockoutProgress(bracket: ResolvedBracket): {
  decided: number;
  total: number;
} {
  let decided = 0;
  for (const m of MATCHES) {
    if (bracket.get(m.id)?.winner != null) decided++;
  }
  return { decided, total: MATCHES.length };
}

/** 予想全体が完成しているか（共有可能か） */
export function isPredictionComplete(
  state: PredictionState,
  bracket: ResolvedBracket,
): boolean {
  return (
    isGroupStageComplete(state) &&
    isThirdComplete(state) &&
    isKnockoutComplete(bracket)
  );
}
