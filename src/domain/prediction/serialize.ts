import type { GroupId, TeamId } from "@/domain/types";
import { resolveBracket } from "@/domain/bracket/generateR32";
import { assignThirdPlaceSlots } from "@/domain/bracket/thirdPlace";
import { getFinalStandings } from "@/domain/bracket/advance";
import type { PredictionState } from "./types";
import { initialPredictionState } from "./types";

// ============================================================================
// store ⇄ D1ペイロード 変換（採点の入口でもある）
//
// SharedPayloadV1 = 共有/保存される「予想の真実」3点 + schemaVersion。
// wizard/meta などUI都合の状態は保存しない。将来移行のため version を持つ。
// ============================================================================

export interface SharedPayloadV1 {
  schemaVersion: 1;
  /** 全12グループの順位 [1位..4位] */
  groupRankings: Record<GroupId, TeamId[]>;
  /** 3位通過する8グループ */
  thirdPlaceQualifiers: GroupId[];
  /** ノックアウト勝者 matchId(73..104) → TeamId */
  knockoutPicks: Record<number, TeamId>;
}

/** state → 保存用ペイロード（完成済み前提。呼び出し側で isPredictionComplete を確認） */
export function toSharedPayload(state: PredictionState): SharedPayloadV1 {
  return {
    schemaVersion: 1,
    groupRankings: { ...state.groupRankings } as Record<GroupId, TeamId[]>,
    thirdPlaceQualifiers: [...state.thirdPlaceQualifiers],
    knockoutPicks: { ...state.knockoutPicks },
  };
}

/** ペイロード → 閲覧用 state（/p/[id] のSSR描画に使う）。wizardはSUMMARY固定 */
export function fromSharedPayload(payload: SharedPayloadV1): PredictionState {
  return {
    ...initialPredictionState(),
    schemaVersion: 1,
    groupRankings: payload.groupRankings,
    thirdPlaceQualifiers: payload.thirdPlaceQualifiers,
    knockoutPicks: payload.knockoutPicks,
    wizard: { step: "SUMMARY", groupCursor: 0 },
  };
}

/** ペイロードからブラケットを解決（閲覧/採点共通の入口） */
export function resolvePayloadBracket(payload: SharedPayloadV1) {
  return resolveBracket({
    groupRankings: payload.groupRankings,
    thirdAssignment: assignThirdPlaceSlots(payload.thirdPlaceQualifiers),
    knockoutPicks: payload.knockoutPicks,
  });
}

/** 優勝チーム（DB非正規化カラム champion_team_id 用） */
export function getChampionFromPayload(
  payload: SharedPayloadV1,
): TeamId | null {
  return getFinalStandings(resolvePayloadBracket(payload)).champion;
}
