"use client";

import { useState } from "react";
import type { GroupId, TeamId } from "@/domain/types";
import { GROUP_IDS } from "@/domain/types";
import { GROUPS } from "@/domain/data/groups";
import type { PredictionState } from "@/domain/prediction/types";
import {
  getRankedGroupCount,
  isGroupRanked,
  isGroupStageComplete,
} from "@/domain/prediction/selectors";
import { dispatch } from "@/state/usePrediction";
import { TeamBadge } from "@/components/TeamBadge";
import { Button } from "@/components/ui/Button";
import { StepFooter } from "./WizardShell";
import { cn } from "@/lib/cn";

const RANK_LABEL = ["1位", "2位", "3位", "4位"];
const RANK_COLOR = [
  "bg-amber-100 text-amber-700", // 1位
  "bg-line text-muted", // 2位
  "bg-orange-100 text-orange-700", // 3位（通過候補）
  "bg-bg text-muted", // 4位
];

/** 1グループ分の順位付け（key=group で再マウントしローカル状態をリセット） */
function GroupRanker({
  group,
  committed,
}: {
  group: GroupId;
  committed: TeamId[] | undefined;
}) {
  const teams = GROUPS[group];
  const [order, setOrder] = useState<TeamId[]>(committed ?? []);

  const apply = (next: TeamId[]) => {
    setOrder(next);
    if (next.length === 4) {
      dispatch({ type: "SET_GROUP_RANKING", group, order: next });
    } else if (committed) {
      // 4未満に戻したらコミット済みを解除（下流pickも整合的に無効化される）
      dispatch({ type: "CLEAR_GROUP_RANKING", group });
    }
  };

  const remaining = teams.filter((t) => !order.includes(t));
  const done = order.length === 4;

  return (
    <div>
      {/* 確定した順位スロット */}
      <div className="space-y-2">
        {RANK_LABEL.map((label, i) => {
          const teamId = order[i];
          return (
            <button
              key={label}
              type="button"
              disabled={!teamId}
              onClick={() => teamId && apply(order.slice(0, i))}
              className={cn(
                "flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left transition",
                teamId
                  ? "bg-surface shadow-soft active:scale-[0.99]"
                  : "border border-dashed border-line bg-transparent",
              )}
            >
              <span
                className={cn(
                  "flex h-7 w-10 shrink-0 items-center justify-center rounded-md text-xs font-bold",
                  RANK_COLOR[i],
                )}
              >
                {label}
              </span>
              {teamId ? (
                <>
                  <TeamBadge teamId={teamId} size="md" className="flex-1" />
                  <span className="text-xs text-muted">タップで変更</span>
                </>
              ) : (
                <span className="text-sm text-muted">未選択</span>
              )}
            </button>
          );
        })}
      </div>

      {/* 残りチームの選択 */}
      {!done ? (
        <div className="mt-5">
          <p className="mb-2 text-sm font-semibold text-ink">
            {RANK_LABEL[order.length]}を選ぶ
          </p>
          <div className="grid grid-cols-2 gap-2">
            {remaining.map((id) => (
              <button
                key={id}
                type="button"
                data-testid="gp-pick"
                data-team={id}
                onClick={() => apply([...order, id])}
                className="flex items-center gap-2 rounded-2xl bg-surface px-3 py-3 text-left shadow-soft transition active:scale-[0.97]"
              >
                <TeamBadge teamId={id} size="md" />
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="mt-5 flex items-center justify-between rounded-2xl bg-brand-soft px-4 py-3">
          <span className="text-sm font-semibold text-brand-deep">
            ✓ {group}組の順位が決まりました
          </span>
          <button
            type="button"
            onClick={() => apply([])}
            className="text-sm font-semibold text-muted underline"
          >
            やり直す
          </button>
        </div>
      )}
    </div>
  );
}

export function StepGroupRanking({ state }: { state: PredictionState }) {
  const cursor = state.wizard.groupCursor;
  const group = GROUP_IDS[cursor];
  const committed = state.groupRankings[group];
  const rankedCount = getRankedGroupCount(state);
  const allDone = isGroupStageComplete(state);
  const currentRanked = isGroupRanked(state, group);

  const goToNext = () => {
    if (allDone) {
      dispatch({ type: "GOTO_STEP", step: "THIRD" });
      return;
    }
    // 次の未確定グループへ（cursorより後 → 先頭から → cursor+1）
    let target = GROUP_IDS.findIndex(
      (g, i) => i > cursor && !isGroupRanked(state, g),
    );
    if (target === -1) {
      target = GROUP_IDS.findIndex((g) => !isGroupRanked(state, g));
    }
    if (target === -1) target = Math.min(cursor + 1, GROUP_IDS.length - 1);
    dispatch({ type: "SET_GROUP_CURSOR", cursor: target });
  };

  return (
    <div>
      <div className="mb-3">
        <div className="flex items-baseline justify-between">
          <h1 className="text-xl font-bold text-ink">グループ {group}</h1>
          <span className="text-sm text-muted">{rankedCount}/12 完了</span>
        </div>
        <p className="mt-1 text-sm text-muted">
          1位から順にタップして順位を決めましょう。
        </p>
      </div>

      {/* グループ選択ピル */}
      <div className="mb-4 -mx-4 overflow-x-auto px-4">
        <div className="flex gap-1.5">
          {GROUP_IDS.map((g, i) => {
            const ranked = isGroupRanked(state, g);
            const active = i === cursor;
            return (
              <button
                key={g}
                type="button"
                data-testid="gp-pill"
                data-group={g}
                onClick={() => dispatch({ type: "SET_GROUP_CURSOR", cursor: i })}
                className={cn(
                  "flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold transition",
                  active
                    ? "bg-brand text-brand-ink shadow-soft"
                    : ranked
                      ? "bg-brand-soft text-brand-deep"
                      : "bg-line text-muted",
                )}
              >
                {g}
              </button>
            );
          })}
        </div>
      </div>

      <GroupRanker key={group} group={group} committed={committed} />

      <StepFooter>
        <Button
          variant="secondary"
          onClick={() =>
            dispatch({ type: "SET_GROUP_CURSOR", cursor: cursor - 1 })
          }
          disabled={cursor === 0}
          className="px-4"
        >
          ←
        </Button>
        <Button
          variant="primary"
          fullWidth
          data-testid="step-next"
          onClick={goToNext}
          disabled={!currentRanked}
        >
          {allDone ? "3位通過の予想へ →" : "次のグループへ →"}
        </Button>
      </StepFooter>
    </div>
  );
}
