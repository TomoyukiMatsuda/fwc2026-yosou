"use client";

import { useEffect, useMemo } from "react";
import type { PredictionState } from "@/domain/prediction/types";
import type { ResolvedBracket } from "@/domain/bracket/generateR32";
import {
  getStandings,
  isPredictionComplete,
} from "@/domain/prediction/selectors";
import {
  toSharedPayload,
  type SharedPayloadV1,
} from "@/domain/prediction/serialize";
import { PredictionSummary } from "@/components/PredictionSummary";
import { ShareSection } from "@/components/ShareSection";
import { Button } from "@/components/ui/Button";
import { dispatch, resetPrediction } from "@/state/usePrediction";
import {
  clearCurrentLocalId,
  saveCompletedPrediction,
} from "@/state/localHistory";
import { StepFooter } from "./WizardShell";

export function StepSummary({
  state,
  bracket,
}: {
  state: PredictionState;
  bracket: ResolvedBracket;
}) {
  // 完成した予想をローカル履歴へ自動保存（同じ下書きは上書き＝重複しない）
  const complete = isPredictionComplete(state, bracket);
  const champion = getStandings(bracket).champion;
  const sig = useMemo(() => JSON.stringify(toSharedPayload(state)), [state]);
  useEffect(() => {
    if (!complete || !champion) return;
    saveCompletedPrediction({
      payload: JSON.parse(sig) as SharedPayloadV1,
      championTeamId: champion,
    });
  }, [sig, complete, champion]);

  const onReset = () => {
    if (window.confirm("予想を最初からやり直しますか？この下書きは消えます。")) {
      clearCurrentLocalId();
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
