import type { GroupId, TeamId } from "@/domain/types";
import { resolveBracket, type GroupRankings } from "@/domain/bracket/generateR32";
import { assignThirdPlaceSlots } from "@/domain/bracket/thirdPlace";
import type { PredictionAction, PredictionState } from "./types";
import { initialPredictionState, THIRD_PLACE_LIMIT } from "./types";

// ============================================================================
// 予想 reducer（純関数）= 状態遷移 + 依存の無効化
//
// 前段（GL順位 / 3位通過）を後から変えると、矛盾する下流pickを自動削除する。
// 無効化はブラケットを1パス解決し直し「現在の対戦カードに整合しないpick」を
// 落とすだけ（resolveBracket が昇順1パスで nullを下流へ伝播するため、
// 1回の解決で推移的に無効なpickが全て winner=null になる＝それを消せば完了）。
// ============================================================================

/**
 * knockoutPicks のうち、現在の対戦カードに整合しないものを削除して返す。
 * @returns picks: 整合するpickのみ / removed: 削除された matchId
 */
function sanitizeKnockoutPicks(
  groupRankings: GroupRankings,
  thirdPlaceQualifiers: GroupId[],
  knockoutPicks: Record<number, TeamId>,
): { picks: Record<number, TeamId>; removed: number[] } {
  const thirdAssignment = assignThirdPlaceSlots(thirdPlaceQualifiers);
  const bracket = resolveBracket({
    groupRankings,
    thirdAssignment,
    knockoutPicks,
  });

  const picks: Record<number, TeamId> = {};
  const removed: number[] = [];
  for (const [idStr, team] of Object.entries(knockoutPicks)) {
    const id = Number(idStr);
    // resolveBracket は「pickが現在の両チームのどちらか」のときだけ winner に採用する。
    // よって winner===team なら整合、そうでなければ（上流崩壊含め）無効。
    if (bracket.get(id)?.winner === team) {
      picks[id] = team;
    } else {
      removed.push(id);
    }
  }
  return { picks, removed };
}

const clamp = (n: number, lo: number, hi: number) =>
  Math.max(lo, Math.min(hi, n));

/**
 * 予想 reducer。純関数（時刻に依存しない）。
 * 変化が無いアクションは同一参照を返し、無駄な再レンダー/再保存を避ける。
 */
export function predictionReducer(
  state: PredictionState,
  action: PredictionAction,
): PredictionState {
  switch (action.type) {
    case "HYDRATE":
      return action.state;

    case "RESET":
      return initialPredictionState();

    case "SET_GROUP_RANKING": {
      const prev = state.groupRankings[action.group];
      // 同じ並びなら no-op
      if (prev && prev.length === 4 && prev.every((id, i) => id === action.order[i])) {
        return state;
      }
      const groupRankings: GroupRankings = {
        ...state.groupRankings,
        [action.group]: action.order,
      };
      const { picks } = sanitizeKnockoutPicks(
        groupRankings,
        state.thirdPlaceQualifiers,
        state.knockoutPicks,
      );
      return { ...state, groupRankings, knockoutPicks: picks };
    }

    case "CLEAR_GROUP_RANKING": {
      if (!state.groupRankings[action.group]) return state;
      const groupRankings = { ...state.groupRankings };
      delete groupRankings[action.group];
      // このグループの3位通過指定も外す（3位チームが未確定になるため）
      const thirdPlaceQualifiers = state.thirdPlaceQualifiers.filter(
        (g) => g !== action.group,
      );
      const { picks } = sanitizeKnockoutPicks(
        groupRankings,
        thirdPlaceQualifiers,
        state.knockoutPicks,
      );
      return { ...state, groupRankings, thirdPlaceQualifiers, knockoutPicks: picks };
    }

    case "TOGGLE_THIRD": {
      const has = state.thirdPlaceQualifiers.includes(action.group);
      let qualifiers: GroupId[];
      if (has) {
        qualifiers = state.thirdPlaceQualifiers.filter((g) => g !== action.group);
      } else {
        if (state.thirdPlaceQualifiers.length >= THIRD_PLACE_LIMIT) {
          return state; // 上限超過は無視
        }
        qualifiers = [...state.thirdPlaceQualifiers, action.group];
      }
      const { picks } = sanitizeKnockoutPicks(
        state.groupRankings,
        qualifiers,
        state.knockoutPicks,
      );
      return { ...state, thirdPlaceQualifiers: qualifiers, knockoutPicks: picks };
    }

    case "SET_THIRDS": {
      const qualifiers = [...new Set(action.groups)].slice(0, THIRD_PLACE_LIMIT);
      const { picks } = sanitizeKnockoutPicks(
        state.groupRankings,
        qualifiers,
        state.knockoutPicks,
      );
      return { ...state, thirdPlaceQualifiers: qualifiers, knockoutPicks: picks };
    }

    case "PICK_WINNER": {
      // 現在の対戦カードを解決し、teamId が参加チームか検証
      const thirdAssignment = assignThirdPlaceSlots(state.thirdPlaceQualifiers);
      const bracket = resolveBracket({
        groupRankings: state.groupRankings,
        thirdAssignment,
        knockoutPicks: state.knockoutPicks,
      });
      const match = bracket.get(action.matchId);
      if (
        !match ||
        (action.teamId !== match.teamA && action.teamId !== match.teamB)
      ) {
        return state; // 不正なpickは無視
      }
      if (state.knockoutPicks[action.matchId] === action.teamId) {
        return state; // no-op
      }
      const nextPicks = {
        ...state.knockoutPicks,
        [action.matchId]: action.teamId,
      };
      // この変更で下流pickが矛盾しうる → 再サニタイズ
      const { picks } = sanitizeKnockoutPicks(
        state.groupRankings,
        state.thirdPlaceQualifiers,
        nextPicks,
      );
      return { ...state, knockoutPicks: picks };
    }

    case "GOTO_STEP":
      if (state.wizard.step === action.step) return state;
      return { ...state, wizard: { ...state.wizard, step: action.step } };

    case "SET_GROUP_CURSOR": {
      const cursor = clamp(action.cursor, 0, 11);
      if (state.wizard.groupCursor === cursor) return state;
      return { ...state, wizard: { ...state.wizard, groupCursor: cursor } };
    }

    default:
      return state;
  }
}

/**
 * 2状態間で削除された knockout pick の matchId を返す（store がトースト通知に使う）。
 */
export function diffRemovedPicks(
  prev: PredictionState,
  next: PredictionState,
): number[] {
  const removed: number[] = [];
  for (const idStr of Object.keys(prev.knockoutPicks)) {
    const id = Number(idStr);
    if (next.knockoutPicks[id] === undefined) removed.push(id);
  }
  return removed;
}
