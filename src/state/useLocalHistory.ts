"use client";

import { useEffect, useSyncExternalStore } from "react";
import {
  getHistoryServerSnapshot,
  getHistorySnapshot,
  hydrateHistory,
  subscribeHistory,
  type LocalPredictionEntry,
} from "./localHistory";

// ============================================================================
// useSyncExternalStore ラッパー（ローカル履歴）。getServerSnapshotで SSR安全。
// ============================================================================

/** ローカル履歴（新しい順）を購読 */
export function useLocalHistory(): readonly LocalPredictionEntry[] {
  return useSyncExternalStore(
    subscribeHistory,
    getHistorySnapshot,
    getHistoryServerSnapshot,
  );
}

/** クライアントマウント後に localStorage から履歴を一度だけ復元 */
export function useLocalHistoryHydration(): void {
  useEffect(() => {
    hydrateHistory();
  }, []);
}
