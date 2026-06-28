import { LocalHistoryList } from "@/components/LocalHistoryList";
import { StartPrediction } from "@/components/StartPrediction";

export default function Home() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col px-6 py-10">
      <div className="flex flex-col items-center pt-10 text-center">
        <p className="mb-2 text-sm font-semibold tracking-wide text-[var(--color-brand)]">
          2026 FIFA WORLD CUP
        </p>
        <h1 className="text-3xl font-bold leading-tight text-[var(--color-ink)]">
          勝ち抜き予想
        </h1>
        <p className="mt-4 text-sm leading-relaxed text-[var(--color-muted)]">
          決勝トーナメントの組み合わせが確定。
          ベスト32から優勝まで、勝ち上がりを予想しよう。
        </p>

        <StartPrediction />
      </div>

      <LocalHistoryList />

      <footer className="mt-auto pt-12 text-center text-xs text-[var(--color-muted)]">
        友人と予想をシェアして楽しむための非公式アプリ
      </footer>
    </main>
  );
}
