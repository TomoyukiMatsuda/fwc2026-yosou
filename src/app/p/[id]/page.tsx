import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache } from "react";
import { eq } from "drizzle-orm";
import { getDb } from "@/db/client";
import { predictions } from "@/db/schema";
import {
  fromSharedPayload,
  resolvePayloadBracket,
} from "@/domain/prediction/serialize";
import { getTeam } from "@/domain/data/teams";
import { PredictionSummary } from "@/components/PredictionSummary";

// D1読み取りの動的ページ。Edge不使用・毎回SSR。
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// generateMetadata と本体で同一リクエスト内のDB読み取りを共有（重複クエリ回避）。
const loadPrediction = cache(async (id: string) => {
  const db = getDb();
  return db.select().from(predictions).where(eq(predictions.id, id)).get();
});

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const row = await loadPrediction(id);
  if (!row) return { title: "予想が見つかりません" };

  const champ = getTeam(row.championTeamId);
  const who = row.nickname ? `${row.nickname}さんの` : "";
  const title = `${who}2026 W杯 勝ち抜き予想`;
  const description = champ
    ? `優勝予想は${champ.nameJa}。あなたも予想して友だちと比べてみよう！`
    : "2026 FIFA W杯の勝ち抜き予想。あなたも予想してみよう！";

  return {
    title,
    description,
    openGraph: { title, description, type: "article" },
    twitter: { card: "summary", title, description },
  };
}

export default async function SharedPredictionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const row = await loadPrediction(id);

  if (!row) notFound();

  const payload = row.payload;
  const state = fromSharedPayload(payload);
  const bracket = resolvePayloadBracket(payload);

  return (
    <main className="mx-auto max-w-md px-4 py-6">
      <header className="mb-5 text-center">
        <p className="text-xs font-semibold tracking-widest text-brand">
          2026 FIFA WORLD CUP
        </p>
        <h1 className="mt-1 text-lg font-bold text-ink">勝ち抜き予想</h1>
      </header>

      <PredictionSummary
        state={state}
        bracket={bracket}
        nickname={row.nickname}
      />

      <div className="mt-8 rounded-2xl border border-line bg-surface p-5 text-center">
        <p className="text-sm font-bold text-ink">あなたも予想してみよう</p>
        <p className="mt-1 text-xs text-muted">
          グループリーグから優勝まで、順番に答えるだけ。
        </p>
        <Link
          href="/predict"
          className="mt-4 inline-block w-full rounded-2xl bg-brand px-6 py-3.5 text-center text-base font-bold text-brand-ink active:scale-[0.98]"
        >
          自分の予想をつくる
        </Link>
      </div>

      <footer className="mt-8 pb-8 text-center text-xs text-muted">
        個人開発 / 非公式アプリ
      </footer>
    </main>
  );
}
