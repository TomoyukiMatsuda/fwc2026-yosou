import type { TeamId } from "@/domain/types";
import type { ResolvedBracket } from "./generateR32";
import { DOWNSTREAM_OF } from "./r32-template";

// ============================================================================
// 勝者進行に関する派生ヘルパー
// ============================================================================

/** ベスト4の最終順位（予想範囲はここまで） */
export interface FinalStandings {
  champion: TeamId | null;
  runnerUp: TeamId | null;
  third: TeamId | null;
  fourth: TeamId | null;
}

/** 決勝(104)・3位決定戦(103)の結果からベスト4を導出 */
export function getFinalStandings(bracket: ResolvedBracket): FinalStandings {
  const final = bracket.get(104);
  const thirdPlace = bracket.get(103);
  return {
    champion: final?.winner ?? null,
    runnerUp: final?.loser ?? null,
    third: thirdPlace?.winner ?? null,
    fourth: thirdPlace?.loser ?? null,
  };
}

/**
 * ある試合の勝敗を（直接・間接に）参照する全下流試合IDを返す（BFS）。
 * カスケード無効化で「この試合のpickが変わったら掃除すべき範囲」を得る。
 */
export function downstreamMatchIds(matchId: number): number[] {
  const out: number[] = [];
  const queue = [...(DOWNSTREAM_OF.get(matchId) ?? [])];
  const seen = new Set<number>(queue);
  while (queue.length > 0) {
    const id = queue.shift()!;
    out.push(id);
    for (const next of DOWNSTREAM_OF.get(id) ?? []) {
      if (!seen.has(next)) {
        seen.add(next);
        queue.push(next);
      }
    }
  }
  return out;
}
