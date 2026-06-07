"use client";

import type { PredictionState } from "@/domain/prediction/types";
import type { ResolvedBracket } from "@/domain/bracket/generateR32";
import { PredictionSummary } from "@/components/PredictionSummary";
import { ShareSection } from "@/components/ShareSection";
import { Button } from "@/components/ui/Button";
import { dispatch, resetPrediction } from "@/state/usePrediction";
import { StepFooter } from "./WizardShell";

export function StepSummary({
  state,
  bracket,
}: {
  state: PredictionState;
  bracket: ResolvedBracket;
}) {
  const onReset = () => {
    if (window.confirm("予想を最初からやり直しますか？この下書きは消えます。")) {
      resetPrediction();
    }
  };

  return (
    <div>
      <div className="mb-4 text-center">
        <div className="text-3xl" aria-hidden>
          🎉
        </div>
        <h1 className="mt-1 text-xl font-bold text-ink">予想が完成しました！</h1>
        <p className="mt-1 text-sm text-muted">
          内容を確認して、友だちに共有しましょう。
        </p>
      </div>

      <PredictionSummary state={state} bracket={bracket} />

      {/* 共有（D1保存 → URL発行） */}
      <div className="mt-6">
        <ShareSection state={state} bracket={bracket} />
      </div>

      <div className="mt-6 text-center">
        <button
          type="button"
          onClick={onReset}
          className="text-sm font-semibold text-muted underline"
        >
          最初からやり直す
        </button>
      </div>

      <StepFooter>
        <Button
          variant="secondary"
          fullWidth
          onClick={() => dispatch({ type: "GOTO_STEP", step: "KNOCKOUT" })}
        >
          ← 予想を修正する
        </Button>
      </StepFooter>
    </div>
  );
}
