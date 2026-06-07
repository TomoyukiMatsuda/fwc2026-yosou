import type { GroupId, Round, TeamId } from "@/domain/types";
import type { BracketSlot } from "./types";
import { MATCHES } from "./r32-template";
import type { ThirdAssignment } from "./thirdPlace";

// ============================================================================
// ブラケット解決（派生状態の導出）
//
// 「真実」= groupRankings / 3位割当 / knockoutPicks の3つから、
// 全試合の対戦カード（teamA/teamB）・勝者・敗者を都度計算する純関数。
// state に派生を保存しないことで「前段変更で後段が壊れない」構造的保証を得る。
// ============================================================================

/** グループ順位表（1位..4位）。ウィザード途中は未確定グループあり=部分的。 */
export type GroupRankings = Partial<Record<GroupId, TeamId[]>>;

/** 解決済みの1試合（チーム確定 or null） */
export interface ResolvedMatch {
  id: number;
  round: Round;
  roundLabel: string;
  /** 上側チーム（未確定なら null） */
  teamA: TeamId | null;
  /** 下側チーム（未確定なら null） */
  teamB: TeamId | null;
  /** 勝者（pick済みかつ整合していれば、両チーム未確定でも保持しない＝null） */
  winner: TeamId | null;
  /** 敗者（勝者確定時のみ） */
  loser: TeamId | null;
  /** 両チームが揃っており勝者を選べる状態か */
  ready: boolean;
}

export type ResolvedBracket = Map<number, ResolvedMatch>;

export interface ResolveInput {
  groupRankings: GroupRankings;
  thirdAssignment: ThirdAssignment;
  knockoutPicks: Record<number, TeamId>;
}

/** 1スロットを実チームID（or null）へ解決 */
function resolveSlot(
  slot: BracketSlot,
  matchId: number,
  input: ResolveInput,
  resolved: ResolvedBracket,
): TeamId | null {
  switch (slot.kind) {
    case "winner":
      return input.groupRankings[slot.group]?.[0] ?? null;
    case "runnerUp":
      return input.groupRankings[slot.group]?.[1] ?? null;
    case "third": {
      const group = input.thirdAssignment[matchId];
      if (!group) return null;
      return input.groupRankings[group]?.[2] ?? null;
    }
    case "matchWinner":
      return resolved.get(slot.matchId)?.winner ?? null;
    case "matchLoser":
      return resolved.get(slot.matchId)?.loser ?? null;
  }
}

/**
 * 全32試合（73〜104）をマッチ番号昇順（=トポロジカル順）に解決する。
 * 下流は上流の勝敗を参照するため、昇順1パスで全て解決できる。
 */
export function resolveBracket(input: ResolveInput): ResolvedBracket {
  const resolved: ResolvedBracket = new Map();

  for (const mt of MATCHES) {
    const teamA = resolveSlot(mt.slotA, mt.id, input, resolved);
    const teamB = resolveSlot(mt.slotB, mt.id, input, resolved);
    const ready = teamA !== null && teamB !== null;

    // pick が現在の対戦カードに整合する場合のみ勝者として採用（防御的）
    const picked = input.knockoutPicks[mt.id] ?? null;
    const winner =
      picked !== null && (picked === teamA || picked === teamB)
        ? picked
        : null;
    const loser =
      winner !== null ? (winner === teamA ? teamB : teamA) : null;

    resolved.set(mt.id, {
      id: mt.id,
      round: mt.round,
      roundLabel: mt.roundLabel,
      teamA,
      teamB,
      winner,
      loser,
      ready,
    });
  }

  return resolved;
}
