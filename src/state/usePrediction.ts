"use client";

import { useEffect, useSyncExternalStore } from "react";
import type { PredictionState } from "@/domain/prediction/types";
import {
  getServerSnapshot,
  getSnapshot,
  hydrateFromStorage,
  subscribe,
} from "./predictionStore";

// ============================================================================
// useSyncExternalStore ラッパー（React公式API）
// getServerSnapshot を渡すことで SSR ハイドレーション安全。
// ============================================================================

/** 予想ステート全体を購読（ステップ式UIなので全体購読で十分） */
export function usePrediction(): PredictionState {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

/**
 * クライアントマウント後に localStorage の下書きを一度だけ復元する。
 * ウィザードのルートで一度呼ぶ。
 */
export function usePredictionHydration(): void {
  useEffect(() => {
    hydrateFromStorage();
  }, []);
}

export { dispatch, resetPrediction, subscribeNotice } from "./predictionStore";
