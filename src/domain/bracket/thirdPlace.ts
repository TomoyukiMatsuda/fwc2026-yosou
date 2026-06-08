import type { GroupId } from "@/domain/types";
import { THIRD_PLACE_MATCH_IDS, THIRD_SLOT_CANDIDATES } from "./r32-template";
import { lookupOfficialThirdPlacement } from "./thirdPlacement";

// ============================================================================
// 3位通過8チームの R32 枠割当
//
// ユーザーが選んだ「3位通過するグループ」（最大8）を、3位スロットを持つ8試合
// （THIRD_PLACE_MATCH_IDS）へ割り当てる。
//
// 8グループが確定したら FIFA 公式 Annex C（495通り）の配置をそのまま引く
// （thirdPlacement.ts）。候補制約を満たすだけの割当では公式と異なりうる
// （495通り中487通りでズレる）ため、公式表で対戦カードを実際の大会に一致させる。
//
// 8グループ未満（選択途中のプレビュー）や万一公式表に無い入力では、候補制約を
// 満たす整合割当を二部最大マッチング（Kuhn法）で求めてフォールバックする。
// 解けない場合のみ制約を緩和して全枠を埋める。決定論的（同じ入力→同じ割当）。
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
  // 8グループ確定時は FIFA 公式 Annex C の配置をそのまま使う（実際の大会と一致）。
  const official = lookupOfficialThirdPlacement(qualifyingGroups);
  if (official) return { ...official };

  // --- フォールバック（8グループ未満のプレビュー / 想定外入力）---
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
