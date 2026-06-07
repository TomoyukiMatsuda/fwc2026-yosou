"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { fromSharedPayload } from "@/domain/prediction/serialize";
import { getBracket } from "@/domain/prediction/selectors";
import { PredictionSummary } from "@/components/PredictionSummary";
import {
  useLocalHistory,
  useLocalHistoryHydration,
} from "@/state/useLocalHistory";
import { formatJaDateTime } from "@/lib/datetime";

/** ローカル履歴の1件を読み取り専用で表示（この端末のlocalStorageからのみ）。 */
export default function HistoryViewPage() {
  useLocalHistoryHydration();
  const entries = useLocalHistory();
  const params = useParams<{ localId: string }>();
  const localId = params?.localId ?? "";

  // ハイドレーション前に「見つかりません」を一瞬出さないためのガード
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);

  const entry = entries.find((e) => e.localId === localId);
  const view = useMemo(() => {
    if (!entry) return null;
    const state = fromSharedPayload(entry.payload);
    return { state, bracket: getBracket(state) };
  }, [entry]);

  return (
    <main className="mx-auto min-h-dvh max-w-md px-4 py-6">
      <header className="mb-4">
        <Link href="/" className="text-sm font-semibold text-muted">
          ← トップ
        </Link>
      </header>

      {!ready ? (
        <p className="mt-24 text-center text-sm text-muted">読み込み中…</p>
      ) : !entry || !view ? (
        <div className="mt-24 text-center">
          <div className="text-4xl" aria-hidden>
            🔍
          </div>
          <p className="mt-3 text-sm leading-relaxed text-muted">
            この予想は見つかりませんでした。
            <br />
            （予想はこの端末のローカル履歴にだけ保存されています）
          </p>
          <Link
            href="/"
            className="mt-6 inline-block rounded-2xl bg-brand px-6 py-3 text-sm font-bold text-brand-ink shadow-soft transition active:scale-[0.98]"
          >
            トップへ戻る
          </Link>
        </div>
      ) : (
        <>
          <div className="mb-4">
            <h1 className="text-lg font-bold text-ink">
              {formatJaDateTime(entry.createdAt)} に作成した予想
            </h1>
            {entry.shareId && (
              <Link
                href={`/p/${entry.shareId}`}
                className="mt-1 inline-block text-xs font-semibold text-brand-deep underline"
              >
                共有ページを開く →
              </Link>
            )}
          </div>

          <PredictionSummary
            state={view.state}
            bracket={view.bracket}
            nickname={entry.nickname}
          />

          <div className="mt-8 pb-10 text-center">
            <Link
              href="/predict"
              className="text-sm font-semibold text-muted underline"
            >
              自分の予想をつくる
            </Link>
          </div>
        </>
      )}
    </main>
  );
}
