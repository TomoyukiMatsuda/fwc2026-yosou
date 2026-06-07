import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center px-6 text-center">
      <div className="text-5xl" aria-hidden>
        🔍
      </div>
      <h1 className="mt-4 text-xl font-bold text-ink">
        予想が見つかりません
      </h1>
      <p className="mt-2 text-sm text-muted">
        URLが間違っているか、削除された可能性があります。
      </p>
      <Link
        href="/"
        className="mt-8 rounded-2xl bg-brand px-6 py-3.5 text-base font-bold text-brand-ink shadow-soft transition active:scale-[0.98] active:shadow-soft-lg"
      >
        トップへ戻る
      </Link>
    </main>
  );
}
