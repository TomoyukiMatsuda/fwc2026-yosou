"use client";

import { useState } from "react";
import type { PredictionState } from "@/domain/prediction/types";
import type { ResolvedBracket } from "@/domain/bracket/generateR32";
import { isPredictionComplete } from "@/domain/prediction/selectors";
import { toSharedPayload } from "@/domain/prediction/serialize";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { attachShareToCurrent } from "@/state/localHistory";

type Status = "idle" | "saving" | "done" | "error";

/** 完成予想を D1 に保存し、共有URL（/p/{id}）を発行するセクション。 */
export function ShareSection({
  state,
  bracket,
}: {
  state: PredictionState;
  bracket: ResolvedBracket;
}) {
  const [nickname, setNickname] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [url, setUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const complete = isPredictionComplete(state, bracket);

  const onShare = async () => {
    if (!complete) return;
    setStatus("saving");
    setError(null);
    try {
      const payload = toSharedPayload(state);
      const res = await fetch("/api/predictions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nickname: nickname.trim() || null,
          payload,
        }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as {
          error?: string;
        } | null;
        throw new Error(body?.error ?? `保存に失敗しました (${res.status})`);
      }
      const data = (await res.json()) as { id: string };
      setUrl(`${window.location.origin}/p/${data.id}`);
      setStatus("done");
      // ローカル履歴の該当エントリに共有ID・ニックネームを紐づける
      attachShareToCurrent(data.id, nickname.trim() || null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "保存に失敗しました");
      setStatus("error");
    }
  };

  const onCopy = async () => {
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* クリップボード不可は無視 */
    }
  };

  const onNativeShare = async () => {
    if (!url || typeof navigator.share !== "function") return;
    try {
      await navigator.share({ title: "2026 W杯 勝ち抜き予想", url });
    } catch {
      /* キャンセル等は無視 */
    }
  };

  if (status === "done" && url) {
    return (
      <Card className="bg-brand-soft/60">
        <p className="text-sm font-bold text-ink">共有用URLができました 🎉</p>
        <p className="mt-1 text-xs text-muted">
          このURLを知っている人だけが予想を見られます。
        </p>
        <div className="mt-3 truncate rounded-2xl bg-surface px-3 py-2.5 text-sm text-ink shadow-soft">
          {url}
        </div>
        <div className="mt-3 flex gap-2">
          <Button variant="primary" fullWidth onClick={onCopy}>
            {copied ? "コピーしました ✓" : "URLをコピー"}
          </Button>
          {typeof navigator !== "undefined" &&
            typeof navigator.share === "function" && (
              <Button variant="secondary" onClick={onNativeShare} className="px-4">
                共有
              </Button>
            )}
        </div>
        <a
          href={url}
          data-testid="share-url"
          className="mt-3 block text-center text-sm font-semibold text-brand underline"
        >
          共有ページを開く
        </a>
      </Card>
    );
  }

  return (
    <Card>
      <p className="text-sm font-bold text-ink">友だちに共有する</p>
      <p className="mt-1 text-xs text-muted">
        ニックネーム（任意）を入れて保存すると、共有URLが発行されます。
      </p>
      <input
        type="text"
        value={nickname}
        onChange={(e) => setNickname(e.target.value)}
        placeholder="ニックネーム（任意）"
        maxLength={20}
        data-testid="share-nickname"
        className="mt-3 w-full rounded-2xl bg-surface-soft px-4 py-3 text-base outline-none ring-1 ring-line transition focus:ring-2 focus:ring-brand"
      />
      {error && <p className="mt-2 text-xs font-semibold text-red-500">{error}</p>}
      <Button
        variant="primary"
        fullWidth
        className="mt-3"
        data-testid="share-submit"
        disabled={!complete || status === "saving"}
        onClick={onShare}
      >
        {status === "saving" ? "保存中…" : "共有URLを発行する"}
      </Button>
    </Card>
  );
}
