import Link from "next/link";

export default function Home() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-between px-6 py-10">
      <div className="flex flex-1 flex-col items-center justify-center text-center">
        <div className="mb-6 text-6xl" aria-hidden>
          🏆
        </div>
        <p className="mb-2 text-sm font-semibold tracking-wide text-[var(--color-brand)]">
          2026 FIFA WORLD CUP
        </p>
        <h1 className="text-3xl font-bold leading-tight text-[var(--color-ink)]">
          勝ち抜き予想
        </h1>
        <p className="mt-4 text-sm leading-relaxed text-[var(--color-muted)]">
          史上初の48チーム制。グループリーグから優勝まで、
          順番に答えるだけで予想が完成します。
          できあがった予想はURLで友だちに共有できます。
        </p>

        <Link
          href="/predict"
          className="mt-10 w-full rounded-2xl bg-[var(--color-brand)] px-6 py-4 text-center text-base font-bold text-[var(--color-brand-ink)] shadow-sm transition active:scale-[0.98]"
        >
          予想をはじめる
        </Link>
        <p className="mt-3 text-xs text-[var(--color-muted)]">
          ログイン不要・途中保存OK
        </p>
      </div>

      <footer className="pt-8 text-center text-xs text-[var(--color-muted)]">
        個人開発 / 友だちと楽しむための非公式アプリ
      </footer>
    </main>
  );
}
