"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  getBracket,
  isPredictionComplete,
} from "@/domain/prediction/selectors";
import {
  resetPrediction,
  usePrediction,
  usePredictionHydration,
} from "@/state/usePrediction";
import { clearCurrentLocalId } from "@/state/localHistory";

const PRIMARY =
  "block w-full rounded-2xl bg-brand px-6 py-4 text-center text-base font-bold text-brand-ink shadow-soft transition active:scale-[0.98] active:shadow-soft-lg";
const SECONDARY =
  "block w-full rounded-2xl bg-surface px-6 py-4 text-center text-base font-bold text-ink shadow-soft transition active:scale-[0.98]";

/**
 * トップのメインCTA。
 * - 作りかけ（未完成の下書き）があるときだけ「前回の続きから」を出す
 * - 「新しい予想をつくる」は常に下書きをリセットしてまっさらから開始
 *   （完成済みの予想は履歴に残っているので失われない）
 */
export function StartPrediction() {
  usePredictionHydration();
  const state = usePrediction();
  const router = useRouter();

  const hasProgress =
    Object.keys(state.groupRankings).length > 0 ||
    state.thirdPlaceQualifiers.length > 0 ||
    Object.keys(state.knockoutPicks).length > 0;
  const inProgress =
    hasProgress && !isPredictionComplete(state, getBracket(state));

  const startNew = () => {
    if (
      inProgress &&
      !window.confirm("作りかけの予想があります。破棄して新しく始めますか？")
    ) {
      return;
    }
    clearCurrentLocalId();
    resetPrediction();
    router.push("/predict");
  };

  return (
    <div className="mt-10 w-full">
      {inProgress && (
        <Link href="/predict" className={PRIMARY}>
          前回の続きから →
        </Link>
      )}
      <button
        type="button"
        onClick={startNew}
        className={inProgress ? `${SECONDARY} mt-3` : PRIMARY}
      >
        新しい予想をつくる
      </button>
    </div>
  );
}
