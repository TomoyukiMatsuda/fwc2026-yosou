"use client";

import type { ResolvedBracket } from "@/domain/bracket/generateR32";
import {
  getKnockoutProgress,
  getNextOpenMatchId,
  isKnockoutComplete,
} from "@/domain/prediction/selectors";
import { dispatch } from "@/state/usePrediction";
import { BracketView } from "@/components/bracket/BracketView";
import { Button } from "@/components/ui/Button";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { GroupStandingsReference } from "./GroupStandingsReference";
import { StepFooter } from "./WizardShell";

export function StepKnockout({ bracket }: { bracket: ResolvedBracket }) {
  const { decided, total } = getKnockoutProgress(bracket);
  const nextOpen = getNextOpenMatchId(bracket);
  const complete = isKnockoutComplete(bracket);

  return (
    <div>
      <div className="mb-3">
        <div className="flex items-baseline justify-between">
          <h1 className="text-xl font-bold text-ink">決勝トーナメント</h1>
          <span className="text-sm font-bold text-muted">
            {decided}/{total}
          </span>
        </div>
        <p className="mt-1 mb-2 text-sm text-muted">
          勝つと思うチームをタップ。ベスト32から決勝まで勝ち上がりを予想します。
        </p>
        <ProgressBar value={decided} max={total} />
      </div>

      <p className="mb-3 rounded-2xl bg-brand-soft px-3 py-2 text-xs font-semibold text-brand-deep">
        組み合わせはFIFA公式で確定済み。勝ち上がりだけを選びます。
      </p>

      <div className="mb-4">
        <GroupStandingsReference />
      </div>

      <BracketView
        bracket={bracket}
        highlightId={nextOpen}
        onPick={(matchId, teamId) =>
          dispatch({ type: "PICK_WINNER", matchId, teamId })
        }
      />

      <StepFooter>
        <Button
          variant="primary"
          fullWidth
          data-testid="step-next"
          disabled={!complete}
          onClick={() => dispatch({ type: "GOTO_STEP", step: "SUMMARY" })}
        >
          {complete ? "完成サマリーへ →" : `あと${total - decided}試合`}
        </Button>
      </StepFooter>
    </div>
  );
}
