"use client";

import { useEffect, useMemo, useState } from "react";
import { getBracket } from "@/domain/prediction/selectors";
import {
  subscribeNotice,
  usePrediction,
  usePredictionHydration,
} from "@/state/usePrediction";
import { WizardShell } from "@/components/wizard/WizardShell";
import { StepKnockout } from "@/components/wizard/StepKnockout";
import { StepSummary } from "@/components/wizard/StepSummary";
import { Toast } from "@/components/ui/Toast";

export default function PredictPage() {
  usePredictionHydration();
  const state = usePrediction();
  const bracket = useMemo(() => getBracket(state), [state]);

  const [notice, setNotice] = useState<{ seq: number; count: number } | null>(
    null,
  );
  useEffect(() => subscribeNotice((n) => setNotice(n)), []);

  const step = state.wizard.step;

  return (
    <WizardShell step={step} bracket={bracket}>
      {step === "KNOCKOUT" && <StepKnockout bracket={bracket} />}
      {step === "SUMMARY" && <StepSummary state={state} bracket={bracket} />}

      {notice && (
        <Toast
          key={notice.seq}
          message={`前段の変更で${notice.count}件の予想を見直しました`}
          onDone={() => setNotice(null)}
        />
      )}
    </WizardShell>
  );
}
