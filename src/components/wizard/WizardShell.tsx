"use client";

import type { PredictionState, WizardStep } from "@/domain/prediction/types";
import type { ResolvedBracket } from "@/domain/bracket/generateR32";
import {
  isGroupStageComplete,
  isKnockoutComplete,
  isThirdComplete,
} from "@/domain/prediction/selectors";
import { dispatch } from "@/state/usePrediction";
import { cn } from "@/lib/cn";

const STEPS: { key: WizardStep; label: string; short: string }[] = [
  { key: "GROUP", label: "グループリーグ", short: "順位" },
  { key: "THIRD", label: "3位通過", short: "3位" },
  { key: "KNOCKOUT", label: "決勝トーナメント", short: "決勝T" },
  { key: "SUMMARY", label: "完成", short: "完成" },
];

/** 各ステップが完了済みか */
function stepDone(
  key: WizardStep,
  state: PredictionState,
  bracket: ResolvedBracket,
): boolean {
  switch (key) {
    case "GROUP":
      return isGroupStageComplete(state);
    case "THIRD":
      return isThirdComplete(state);
    case "KNOCKOUT":
      return isKnockoutComplete(bracket);
    case "SUMMARY":
      return false;
  }
}

/** そのステップへ移動可能か（前提ステップが完了しているか） */
function canGoTo(
  key: WizardStep,
  state: PredictionState,
  bracket: ResolvedBracket,
): boolean {
  switch (key) {
    case "GROUP":
      return true;
    case "THIRD":
      return isGroupStageComplete(state);
    case "KNOCKOUT":
      return isGroupStageComplete(state) && isThirdComplete(state);
    case "SUMMARY":
      return (
        isGroupStageComplete(state) &&
        isThirdComplete(state) &&
        isKnockoutComplete(bracket)
      );
  }
}

function StepIndicator({
  current,
  state,
  bracket,
}: {
  current: WizardStep;
  state: PredictionState;
  bracket: ResolvedBracket;
}) {
  const currentIndex = STEPS.findIndex((s) => s.key === current);
  return (
    <nav className="flex items-center gap-1.5 px-4 pt-4 pb-3">
      {STEPS.map((s, i) => {
        const done = stepDone(s.key, state, bracket);
        const active = s.key === current;
        const reachable = canGoTo(s.key, state, bracket);
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
                "flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold",
                active
                  ? "bg-brand text-brand-ink"
                  : done || passed
                    ? "bg-brand/15 text-brand"
                    : "bg-slate-200 text-slate-400",
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
  state,
  bracket,
  children,
}: {
  step: WizardStep;
  state: PredictionState;
  bracket: ResolvedBracket;
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col">
      <header className="sticky top-0 z-10 border-b border-line bg-bg/90 backdrop-blur">
        <StepIndicator current={step} state={state} bracket={bracket} />
      </header>
      <main className="flex-1 px-4 pb-32 pt-2">{children}</main>
    </div>
  );
}

/** ステップ共通の固定フッター（画面下に貼り付く） */
export function StepFooter({ children }: { children: React.ReactNode }) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-10 border-t border-line bg-surface/95 backdrop-blur">
      <div className="mx-auto flex max-w-md items-center gap-3 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        {children}
      </div>
    </div>
  );
}
