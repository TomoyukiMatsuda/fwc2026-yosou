import type { GroupId } from "@/domain/types";
import { THIRD_PLACE_MATCH_IDS, THIRD_SLOT_CANDIDATES } from "./r32-template";

// ============================================================================
// 3位通過8チームの R32 枠割当
//
// ユーザーが選んだ「3位通過するグループ」（最大8）を、3位スロットを持つ8試合
// （THIRD_PLACE_MATCH_IDS）へ、各スロットの候補グループ制約を満たして割り当てる。
//
// 公式は495シナリオ早見表だが、採点は到達ラウンド方式で対戦カードの厳密配置に
// 非依存。よって「制約を満たす任意の整合割当」で十分。ただし素朴な貪欲だと
// 解ける組合せでも失敗しうるので、二部最大マッチング（Kuhn法）で確実に解く。
// 解けない場合のみ制約を緩和して必ず全枠を埋める（フォールバック）。
// 決定論的（同じ入力→同じ割当）。
// ============================================================================

/** 割当結果: 試合ID → その3位スロットに入るグループID */
export type ThirdAssignment = Record<number, GroupId>;

/**
 * @param qualifyingGroups 3位通過するグループID（0〜8件）。順不同。
 * @returns 試合ID→グループID の割当（割り当てられたスロットのみ含む）
 */
export function assignThirdPlaceSlots(
  qualifyingGroups: GroupId[],
): ThirdAssignment {
  // 入力を正規化（重複除去・グループ辞書順で決定論化）
  const groups = [...new Set(qualifyingGroups)].sort();

  const slotMatch = new Map<number, GroupId>(); // slotMatchId → group
  const groupMatch = new Map<GroupId, number>(); // group → slotMatchId

  // Kuhn 法: 各スロットについて増加道を探す
  const augment = (slotId: number, visited: Set<GroupId>): boolean => {
    // 候補はテンプレート順を維持しつつ、通過グループに限定（決定論的）
    for (const g of THIRD_SLOT_CANDIDATES[slotId]) {
      if (!groups.includes(g) || visited.has(g)) continue;
      visited.add(g);
      const occupiedBy = groupMatch.get(g);
      if (occupiedBy === undefined || augment(occupiedBy, visited)) {
        slotMatch.set(slotId, g);
        groupMatch.set(g, slotId);
        return true;
      }
    }
    return false;
  };

  for (const slotId of THIRD_PLACE_MATCH_IDS) {
    augment(slotId, new Set());
  }

  // フォールバック: マッチングで埋まらなかったスロットへ、未割当グループを
  // 制約無視で昇順に詰める（理論上valid 8-subsetでは到達しないはず）。
  const assignedGroups = new Set(slotMatch.values());
  const leftoverGroups = groups.filter((g) => !assignedGroups.has(g));
  const emptySlots = THIRD_PLACE_MATCH_IDS.filter((id) => !slotMatch.has(id));
  for (let i = 0; i < emptySlots.length && i < leftoverGroups.length; i++) {
    slotMatch.set(emptySlots[i], leftoverGroups[i]);
  }

  return Object.fromEntries(slotMatch);
}
