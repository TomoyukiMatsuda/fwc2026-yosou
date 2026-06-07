"use client";

import { GROUP_IDS } from "@/domain/types";
import type { PredictionState } from "@/domain/prediction/types";
import { THIRD_PLACE_LIMIT } from "@/domain/prediction/types";
import { getGroupThirdTeam } from "@/domain/prediction/selectors";
import { dispatch } from "@/state/usePrediction";
import { TeamBadge } from "@/components/TeamBadge";
import { Button } from "@/components/ui/Button";
import { StepFooter } from "./WizardShell";
import { cn } from "@/lib/cn";

export function StepThirdPlace({ state }: { state: PredictionState }) {
  const selected = state.thirdPlaceQualifiers;
  const count = selected.length;
  const complete = count === THIRD_PLACE_LIMIT;
  const full = count >= THIRD_PLACE_LIMIT;

  return (
    <div>
      <div className="mb-3">
        <div className="flex items-baseline justify-between">
          <h1 className="text-xl font-bold text-ink">3位通過チーム</h1>
          <span
            className={cn(
              "text-sm font-bold",
              complete ? "text-brand" : "text-muted",
            )}
          >
            {count}/8 選択
          </span>
        </div>
        <p className="mt-1 text-sm text-muted">
          各組3位の中から、決勝トーナメントに進む8チームを選びます。
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {GROUP_IDS.map((g) => {
          const teamId = getGroupThirdTeam(state, g);
          const isSelected = selected.includes(g);
          const order = isSelected ? selected.indexOf(g) + 1 : null;
          const disabled = !teamId || (full && !isSelected);
          return (
            <button
              key={g}
              type="button"
              data-testid="third-card"
              data-group={g}
              disabled={disabled}
              onClick={() => dispatch({ type: "TOGGLE_THIRD", group: g })}
              className={cn(
                "relative flex flex-col gap-1.5 rounded-2xl px-3 py-3 text-left transition",
                isSelected
                  ? "bg-brand-soft shadow-soft ring-1 ring-brand/20 active:scale-[0.97]"
                  : disabled
                    ? "bg-bg opacity-50"
                    : "bg-surface shadow-soft active:scale-[0.97]",
              )}
            >
              <span
                className={cn(
                  "text-xs font-bold",
                  isSelected ? "text-brand-deep" : "text-muted",
                )}
              >
                {g}組 3位
              </span>
              <TeamBadge teamId={teamId} size="md" />
              {isSelected && (
                <span className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-brand text-[11px] font-bold text-brand-ink">
                  {order}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {full && (
        <p className="mt-4 text-center text-xs text-muted">
          8チーム選択済み。変更するにはどれかを外してください。
        </p>
      )}

      <StepFooter>
        <Button
          variant="secondary"
          onClick={() => dispatch({ type: "GOTO_STEP", step: "GROUP" })}
          className="px-4"
        >
          ←
        </Button>
        <Button
          variant="primary"
          fullWidth
          data-testid="step-next"
          disabled={!complete}
          onClick={() => dispatch({ type: "GOTO_STEP", step: "KNOCKOUT" })}
        >
          決勝トーナメントへ →
        </Button>
      </StepFooter>
    </div>
  );
}
