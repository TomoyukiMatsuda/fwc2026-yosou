import {
  diffRemovedPicks,
  predictionReducer,
} from "@/domain/prediction/reducer";
import {
  DEFAULT_PREDICTION_STATE,
  initialPredictionState,
  type PredictionAction,
  type PredictionState,
} from "@/domain/prediction/types";

// ============================================================================
// 自前の軽量ストア（useSyncExternalStore 用）
//
// Zustand等は使わず、外部ストアの仕組み（state + listeners + subscribe +
// getSnapshot + dispatch）を公式APIで最小実装する＝魔法がなく挙動が全部見える。
// Provider不要（モジュールシングルトン）。reducerはdomainの純関数。
// localStorage同期もここで行う。
// ============================================================================

// 決勝トーナメント予想モード専用キー。旧 -prediction-v1（グループ予想の下書き）とは
// 分離する＝確定済みの今、旧未完成下書きは意味を失っており復元しない。
const STORAGE_KEY = "fifa-wcup2026-knockout-v1";

// モジュール初期値は「空のデフォルト」。localStorageはマウント後に読み込み、
// サーバ初期レンダーと初回クライアントレンダーを一致させる（ハイドレーション安全）。
let state: PredictionState = initialPredictionState();
const listeners = new Set<() => void>();
let hydrated = false;

// --- 無効化トースト用の軽量イベント（状態とは別チャネル） ---
export interface InvalidateNotice {
  seq: number;
  count: number;
}
const noticeListeners = new Set<(n: InvalidateNotice) => void>();
let noticeSeq = 0;

// ---------- useSyncExternalStore I/F ----------

export function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** クライアントの現在スナップショット（参照は変化時のみ変わる） */
export function getSnapshot(): PredictionState {
  return state;
}

/** SSR/初回ハイドレーション用。常にデフォルト（参照安定）を返す */
export function getServerSnapshot(): PredictionState {
  return DEFAULT_PREDICTION_STATE;
}

// ---------- 更新 ----------

function persist(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ストレージ不可（プライベートモード等）は黙って無視
  }
}

const INVALIDATING_ACTIONS = new Set<PredictionAction["type"]>([
  "SET_GROUP_RANKING",
  "TOGGLE_THIRD",
  "SET_THIRDS",
  "PICK_WINNER",
]);

export function dispatch(action: PredictionAction): void {
  const prev = state;
  const next = predictionReducer(prev, action);
  if (next === prev) return; // 変化なし

  // 時刻の打刻は store の責務（reducerは純粋に保つ）。HYDRATEは保存値を尊重。
  state =
    action.type === "HYDRATE"
      ? next
      : { ...next, meta: { ...next.meta, updatedAt: Date.now() } };

  for (const l of listeners) l();

  if (action.type !== "HYDRATE") persist();

  // カスケード無効化が起きたらトースト通知
  if (INVALIDATING_ACTIONS.has(action.type)) {
    const removed = diffRemovedPicks(prev, next);
    if (removed.length > 0) {
      const notice: InvalidateNotice = { seq: ++noticeSeq, count: removed.length };
      for (const l of noticeListeners) l(notice);
    }
  }
}

// ---------- localStorage ハイドレーション ----------

function normalizeStored(raw: unknown): PredictionState | null {
  if (!raw || typeof raw !== "object") return null;
  const p = raw as Partial<PredictionState>;
  if (p.schemaVersion !== 1) return null; // 将来のバージョン移行はここで
  // groupRankings / thirdPlaceQualifiers は常にプリセット（確定値）を使う。
  // 復元するのは knockoutPicks と wizard.step のみ＝古い値で確定順位が上書きされない。
  const step = p.wizard?.step === "SUMMARY" ? "SUMMARY" : "KNOCKOUT";
  return {
    ...initialPredictionState(),
    knockoutPicks: p.knockoutPicks ?? {},
    wizard: { step, groupCursor: 0 },
    meta: { updatedAt: p.meta?.updatedAt ?? 0 },
  };
}

/** localStorageから下書きを復元（クライアントで一度だけ） */
export function hydrateFromStorage(): void {
  if (hydrated || typeof window === "undefined") return;
  hydrated = true;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const restored = normalizeStored(JSON.parse(raw));
    if (restored) dispatch({ type: "HYDRATE", state: restored });
  } catch {
    // 壊れた保存値は無視（デフォルトのまま開始）
  }
}

/** 下書きを破棄して初期状態へ */
export function resetPrediction(): void {
  dispatch({ type: "RESET" });
}

// ---------- 無効化トースト購読 ----------

export function subscribeNotice(
  listener: (n: InvalidateNotice) => void,
): () => void {
  noticeListeners.add(listener);
  return () => {
    noticeListeners.delete(listener);
  };
}
