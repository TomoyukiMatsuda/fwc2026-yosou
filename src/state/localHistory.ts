import type { SharedPayloadV1 } from "@/domain/prediction/serialize";
import type { TeamId } from "@/domain/types";
import { newShareId } from "@/lib/id";

// ============================================================================
// ローカル履歴ストア（完成した予想の控えを localStorage に保持）
//
// 予想の単一下書き（predictionStore）とは別チャネル。
// 予想を完成させると自動で1件 upsert される（1予想＝1エントリ）。
//   - 編集中は同じ localId を上書き（CURRENT_ID_KEY に保持）
//   - 「最初からやり直す」で clearCurrentLocalId → 次の完成は新規エントリ
// predictionStore と同じく useSyncExternalStore で購読（ハイドレーション安全）。
// ============================================================================

const HISTORY_KEY = "fifa-wcup2026-history-v1";
const CURRENT_ID_KEY = "fifa-wcup2026-current-local-id";
const HISTORY_LIMIT = 50;

export interface LocalPredictionEntry {
  /** ローカル一意ID（共有IDとは別） */
  localId: string;
  /** 予想の真実3点 */
  payload: SharedPayloadV1;
  /** 優勝チーム（一覧表示の非正規化） */
  championTeamId: TeamId;
  /** 共有時に入れたニックネーム（未共有はnull） */
  nickname: string | null;
  /** 最初に完成した時刻(ms)＝「作成した予想」の日時 */
  createdAt: number;
  /** 最終更新時刻(ms) */
  updatedAt: number;
  /** D1共有済みなら共有ID（/p/{id}）。未共有はnull */
  shareId: string | null;
}

let entries: LocalPredictionEntry[] = [];
let hydrated = false;
const listeners = new Set<() => void>();
const EMPTY: readonly LocalPredictionEntry[] = Object.freeze([]);

// ---------- useSyncExternalStore I/F ----------

export function subscribeHistory(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** クライアントの現在スナップショット（参照は変化時のみ変わる） */
export function getHistorySnapshot(): readonly LocalPredictionEntry[] {
  return entries;
}

/** SSR/初回ハイドレーション用。常に空（参照安定）を返す */
export function getHistoryServerSnapshot(): readonly LocalPredictionEntry[] {
  return EMPTY;
}

// ---------- 内部ユーティリティ ----------

function emit(): void {
  for (const l of listeners) l();
}

function persist(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(HISTORY_KEY, JSON.stringify(entries));
  } catch {
    // ストレージ不可は黙って無視
  }
}

/** 保存値を安全に正規化（壊れたエントリは捨てる/既定値で補完） */
function normalizeEntry(x: unknown): LocalPredictionEntry | null {
  if (!x || typeof x !== "object") return null;
  const e = x as Record<string, unknown>;
  if (typeof e.localId !== "string") return null;
  const payload = e.payload as { schemaVersion?: unknown } | undefined;
  if (!payload || payload.schemaVersion !== 1) return null;
  if (typeof e.championTeamId !== "string") return null;
  const createdAt = typeof e.createdAt === "number" ? e.createdAt : 0;
  return {
    localId: e.localId,
    payload: e.payload as SharedPayloadV1,
    championTeamId: e.championTeamId,
    nickname: typeof e.nickname === "string" ? e.nickname : null,
    createdAt,
    updatedAt: typeof e.updatedAt === "number" ? e.updatedAt : createdAt,
    shareId: typeof e.shareId === "string" ? e.shareId : null,
  };
}

/** localStorageから履歴を復元（クライアントで一度だけ） */
export function hydrateHistory(): void {
  if (hydrated || typeof window === "undefined") return;
  hydrated = true;
  try {
    const raw = window.localStorage.getItem(HISTORY_KEY);
    if (!raw) return;
    const arr = JSON.parse(raw);
    if (!Array.isArray(arr)) return;
    const restored = arr
      .map(normalizeEntry)
      .filter((e): e is LocalPredictionEntry => e !== null);
    if (restored.length > 0) {
      entries = restored;
      emit();
    }
  } catch {
    // 壊れた保存値は無視
  }
}

// ---------- 現在の下書きに紐づくローカルID ----------

/** 編集中の予想に対応する localId を取得（無ければ生成して永続化） */
export function ensureCurrentLocalId(): string {
  if (typeof window === "undefined") return "";
  try {
    const cur = window.localStorage.getItem(CURRENT_ID_KEY);
    if (cur) return cur;
    const id = newShareId();
    window.localStorage.setItem(CURRENT_ID_KEY, id);
    return id;
  } catch {
    return newShareId();
  }
}

/** 現在の下書きIDを破棄（リセット時。次の完成予想は新規エントリになる） */
export function clearCurrentLocalId(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(CURRENT_ID_KEY);
  } catch {
    // 無視
  }
}

// ---------- 更新操作 ----------

/** 完成した予想を履歴に upsert（同じlocalIdは上書き・内容不変ならno-op） */
export function saveCompletedPrediction(input: {
  payload: SharedPayloadV1;
  championTeamId: TeamId;
  nickname?: string | null;
}): string {
  const localId = ensureCurrentLocalId();
  if (!localId) return "";
  hydrateHistory();

  const now = Date.now();
  const idx = entries.findIndex((e) => e.localId === localId);

  if (idx >= 0) {
    const cur = entries[idx];
    const nextNickname =
      input.nickname !== undefined ? input.nickname : cur.nickname;
    const unchanged =
      cur.championTeamId === input.championTeamId &&
      cur.nickname === nextNickname &&
      JSON.stringify(cur.payload) === JSON.stringify(input.payload);
    if (unchanged) return localId; // 余計な書き込み/再描画を避ける
    const updated: LocalPredictionEntry = {
      ...cur,
      payload: input.payload,
      championTeamId: input.championTeamId,
      nickname: nextNickname,
      updatedAt: now,
    };
    entries = [...entries.slice(0, idx), updated, ...entries.slice(idx + 1)];
  } else {
    const created: LocalPredictionEntry = {
      localId,
      payload: input.payload,
      championTeamId: input.championTeamId,
      nickname: input.nickname ?? null,
      createdAt: now,
      updatedAt: now,
      shareId: null,
    };
    entries = [created, ...entries].slice(0, HISTORY_LIMIT);
  }

  persist();
  emit();
  return localId;
}

/** 共有成功時、現在のエントリに共有ID・ニックネームを付与 */
export function attachShareToCurrent(
  shareId: string,
  nickname: string | null,
): void {
  if (typeof window === "undefined") return;
  hydrateHistory();
  const localId = ensureCurrentLocalId();
  const idx = entries.findIndex((e) => e.localId === localId);
  if (idx < 0) return;
  const cur = entries[idx];
  const updated: LocalPredictionEntry = {
    ...cur,
    shareId,
    nickname: nickname ?? cur.nickname,
    updatedAt: Date.now(),
  };
  entries = [...entries.slice(0, idx), updated, ...entries.slice(idx + 1)];
  persist();
  emit();
}

/** 履歴から1件削除 */
export function removeHistoryEntry(localId: string): void {
  hydrateHistory();
  const next = entries.filter((e) => e.localId !== localId);
  if (next.length === entries.length) return;
  entries = next;
  persist();
  emit();
}
