"use client";

import Link from "next/link";
import {
  useLocalHistory,
  useLocalHistoryHydration,
} from "@/state/useLocalHistory";
import { removeHistoryEntry } from "@/state/localHistory";
import { TeamBadge } from "@/components/TeamBadge";
import { formatJaDateTime } from "@/lib/datetime";

/** トップページの「これまでの予想」一覧（localStorageの履歴。空なら何も出さない）。 */
export function LocalHistoryList() {
  useLocalHistoryHydration();
  const entries = useLocalHistory();

  if (entries.length === 0) return null;

  const onDelete = (localId: string) => {
    if (window.confirm("この予想を履歴から削除しますか？")) {
      removeHistoryEntry(localId);
    }
  };

  return (
    <section className="mt-12 w-full text-left">
      <h2 className="mb-3 px-1 text-sm font-bold text-[var(--color-ink)]">
        これまでの予想
      </h2>
      <ul className="space-y-2.5">
        {entries.map((e) => (
          <li key={e.localId} className="relative">
            <Link
              href={`/history/${e.localId}`}
              className="flex items-center gap-3 rounded-2xl bg-surface p-4 pr-12 shadow-soft transition active:scale-[0.99]"
            >
              <span
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-soft text-xl"
                aria-hidden
              >
                🏆
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-bold text-ink">
                  {formatJaDateTime(e.createdAt)} に作成した予想
                </span>
                <span className="mt-0.5 flex items-center gap-1 text-xs text-muted">
                  優勝予想
                  <TeamBadge teamId={e.championTeamId} size="sm" />
                  {e.shareId && (
                    <span className="ml-1 rounded-full bg-brand-soft px-1.5 py-0.5 text-[10px] font-bold text-brand-deep">
                      共有済み
                    </span>
                  )}
                </span>
              </span>
            </Link>
            <button
              type="button"
              onClick={() => onDelete(e.localId)}
              aria-label="この予想を削除"
              className="absolute right-1.5 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-base text-muted transition active:bg-brand-soft/60"
            >
              ✕
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
