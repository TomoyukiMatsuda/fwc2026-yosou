import type { GroupId, TeamId } from "@/domain/types";
import {
  CONFIRMED_GROUP_RANKINGS,
  CONFIRMED_THIRD_QUALIFIERS,
} from "@/domain/data/finalStandings";

// ============================================================================
// 予想ウィザードの状態モデル
//
// 「真実」は3つだけ: groupRankings / thirdPlaceQualifiers / knockoutPicks。
// 1位リスト・R32対戦表・ベスト4などの派生は state に保存せず都度計算する
// （domain/bracket の純関数 + UI側 useMemo）。前段変更で後段が壊れない構造的保証。
//
// グループステージは確定済み（2026-06-28）。groupRankings / thirdPlaceQualifiers
// を確定値でプリセットし、ユーザーは knockoutPicks（勝ち上がり）だけを操作する。
// ============================================================================

/** ウィザードの2ステップ（決勝トーナメント予想 → 完成サマリー） */
export type WizardStep = "KNOCKOUT" | "SUMMARY";

export const WIZARD_STEPS: WizardStep[] = ["KNOCKOUT", "SUMMARY"];

export interface PredictionState {
  /** 将来のマイグレーション用 */
  schemaVersion: 1;
  /** 各グループの順位 [1位,2位,3位,4位]（TeamId）。未確定グループはキー無し */
  groupRankings: Partial<Record<GroupId, TeamId[]>>;
  /**
   * 3位通過する「グループID」（0〜8件）。
   * 通過チームではなくグループで保持＝グループ順位を後から変えても
   * 参照が腐らない（3位チームは groupRankings から都度導出）。
   */
  thirdPlaceQualifiers: GroupId[];
  /** ノックアウトの勝者pick。matchId(73〜104) → 勝者TeamId */
  knockoutPicks: Record<number, TeamId>;
  /** ウィザード進行状態（完了判定は selectors で都度導出するので保持しない） */
  wizard: {
    step: WizardStep;
    /** GROUPステップで今編集中のグループindex（0〜11） */
    groupCursor: number;
  };
  meta: {
    /** 最終更新時刻(ms)。store が dispatch 時に打刻（reducerは純粋に保つ） */
    updatedAt: number;
  };
}

/** 予想を更新するアクション */
export type PredictionAction =
  /** あるグループの順位を [1位,2位,3位,4位] で確定 */
  | { type: "SET_GROUP_RANKING"; group: GroupId; order: TeamId[] }
  /** あるグループの順位確定を解除（4未満に戻したとき等） */
  | { type: "CLEAR_GROUP_RANKING"; group: GroupId }
  /** 3位通過グループの追加/削除トグル（上限8） */
  | { type: "TOGGLE_THIRD"; group: GroupId }
  /** 3位通過グループ集合をまとめて設定 */
  | { type: "SET_THIRDS"; groups: GroupId[] }
  /** ノックアウトの勝者を選択 */
  | { type: "PICK_WINNER"; matchId: number; teamId: TeamId }
  /** ステップ移動 */
  | { type: "GOTO_STEP"; step: WizardStep }
  /** GROUPステップのカーソル移動 */
  | { type: "SET_GROUP_CURSOR"; cursor: number }
  /** 全リセット */
  | { type: "RESET" }
  /** localStorage等からの状態復元（全置換） */
  | { type: "HYDRATE"; state: PredictionState };

/**
 * 初期状態（毎回新規オブジェクトを生成）。
 * グループ順位・3位通過は確定値でプリセット（編集不可）。ユーザーが操作するのは
 * knockoutPicks のみ。RESET / SSRデフォルト / hydrate すべてこの起点を共有するため、
 * 「RESET→確定ベースライン復帰」「SSR初回描画＝確定R32」が追加コードなしで一貫する。
 */
export function initialPredictionState(): PredictionState {
  return {
    schemaVersion: 1,
    groupRankings: { ...CONFIRMED_GROUP_RANKINGS },
    thirdPlaceQualifiers: [...CONFIRMED_THIRD_QUALIFIERS],
    knockoutPicks: {},
    wizard: { step: "KNOCKOUT", groupCursor: 0 },
    meta: { updatedAt: 0 },
  };
}

/** SSR / 初回ハイドレーション用の不変デフォルト（参照安定） */
export const DEFAULT_PREDICTION_STATE: PredictionState =
  Object.freeze(initialPredictionState()) as PredictionState;

/** 3位通過の上限 */
export const THIRD_PLACE_LIMIT = 8;
