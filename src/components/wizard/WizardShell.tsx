"use client";

import Link from "next/link";
import type { WizardStep } from "@/domain/prediction/types";
import type { ResolvedBracket } from "@/domain/bracket/generateR32";
import { isKnockoutComplete } from "@/domain/prediction/selectors";
import { dispatch } from "@/state/usePrediction";
import { cn } from "@/lib/cn";

const STEPS: { key: WizardStep; label: string; short: string }[] = [
  { key: "KNOCKOUT", label: "決勝トーナメント", short: "決勝T" },
  { key: "SUMMARY", label: "完成", short: "完成" },
];

/** 各ステップが完了済みか */
function stepDone(key: WizardStep, bracket: ResolvedBracket): boolean {
  switch (key) {
    case "KNOCKOUT":
      return isKnockoutComplete(bracket);
    case "SUMMARY":
      return false;
  }
}

/** そのステップへ移動可能か（KNOCKOUTは常時、SUMMARYは勝ち上がり完成後） */
function canGoTo(key: WizardStep, bracket: ResolvedBracket): boolean {
  switch (key) {
    case "KNOCKOUT":
      return true;
    case "SUMMARY":
      return isKnockoutComplete(bracket);
  }
}

function StepIndicator({
  current,
  bracket,
}: {
  current: WizardStep;
  bracket: ResolvedBracket;
}) {
  const currentIndex = STEPS.findIndex((s) => s.key === current);
  return (
    <nav className="flex items-center gap-1.5 px-4 pt-2 pb-3">
      {STEPS.map((s, i) => {
        const done = stepDone(s.key, bracket);
        const active = s.key === current;
        const reachable = canGoTo(s.key, bracket);
        const passed = i < currentIndex;
        return (
          <button
            key={s.key}
            type="button"
            data-testid={`nav-${s.key}`}
            disabled={!reachable || active}
            onClick={() => dispatch({ type: "GOTO_STEP", step: s.key })}
            className={cn(
              "flex flex-1 flex-col items-center gap-1.5 rounded-lg py-1 transition",
              reachable && !active ? "cursor-pointer" : "cursor-default",
            )}
          >
            <span
              className={cn(
                "flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition",
                active
                  ? "bg-brand text-brand-ink shadow-soft"
                  : done || passed
                    ? "bg-brand-soft text-brand-deep"
                    : "bg-line text-muted",
              )}
            >
              {done && !active ? "✓" : i + 1}
            </span>
            <span
              className={cn(
                "text-[10px] font-semibold",
                active ? "text-ink" : "text-muted",
              )}
            >
              {s.short}
            </span>
          </button>
        );
      })}
    </nav>
  );
}

export function WizardShell({
  step,
  bracket,
  children,
}: {
  step: WizardStep;
  bracket: ResolvedBracket;
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col">
      <header className="sticky top-0 z-10 bg-bg/85 backdrop-blur">
        <div className="px-4 pt-3">
          <Link
            href="/"
            className="-ml-1 inline-flex items-center gap-1 rounded-lg px-1 py-0.5 text-sm font-semibold text-muted transition active:text-ink"
          >
            ← トップ
          </Link>
        </div>
        <StepIndicator current={step} bracket={bracket} />
      </header>
      <main className="flex-1 px-4 pb-32 pt-2">{children}</main>
    </div>
  );
}

/** ステップ共通の固定フッター（画面下に貼り付く） */
export function StepFooter({ children }: { children: React.ReactNode }) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-10 bg-surface/95 shadow-up backdrop-blur">
      <div className="mx-auto flex max-w-md items-center gap-3 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        {children}
      </div>
    </div>
  );
}
