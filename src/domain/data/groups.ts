import type { Group, GroupId, TeamId } from "@/domain/types";
import { GROUP_IDS } from "@/domain/types";
import { TEAM_LIST } from "./teams";

// ============================================================================
// 12グループ × 4チームの確定データ
//
// TEAM_LIST（グループ順×スロット順で並んだ48チーム）を4件ずつに区切って導出。
// 手動再入力による不整合（ドリフト）を構造的に排除する。
// ============================================================================

if (TEAM_LIST.length !== 48) {
  throw new Error(
    `TEAM_LIST は48チームである必要があります（現在 ${TEAM_LIST.length}）`,
  );
}

/** GroupId → そのグループの4チームID（スロット順 = pot/シード順） */
export const GROUPS: Record<GroupId, TeamId[]> = Object.fromEntries(
  GROUP_IDS.map((gid, gi) => [
    gid,
    TEAM_LIST.slice(gi * 4, gi * 4 + 4).map((t) => t.id),
  ]),
) as Record<GroupId, TeamId[]>;

/** Group[] 形式（id + teamIds） */
export const GROUP_LIST: Group[] = GROUP_IDS.map((id) => ({
  id,
  teamIds: GROUPS[id],
}));

/** 指定グループの4チームID（スロット順） */
export function getGroupTeamIds(group: GroupId): TeamId[] {
  return GROUPS[group];
}
