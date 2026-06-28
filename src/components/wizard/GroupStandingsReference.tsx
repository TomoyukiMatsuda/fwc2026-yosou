import { GROUP_IDS } from "@/domain/types";
import {
  CONFIRMED_GROUP_RANKINGS,
  CONFIRMED_THIRD_QUALIFIERS,
} from "@/domain/data/finalStandings";
import { TeamBadge } from "@/components/TeamBadge";
import { cn } from "@/lib/cn";

const RANK_CHIP = ["1位", "2位", "3位", "4位"];

/**
 * 確定したグループリーグ最終順位の読み取り専用の参考表示（折りたたみ）。
 * StepKnockout 内に置き、「どの組の何位同士の対戦か」を確認できるようにする。
 * マークアップは PredictionSummary のグループ節と揃える。
 */
export function GroupStandingsReference() {
  return (
    <details className="rounded-3xl bg-surface shadow-soft">
      <summary className="cursor-pointer px-4 py-3 text-sm font-bold text-ink">
        グループリーグ 最終順位（確定）
      </summary>
      <div className="space-y-3 px-4 pb-4">
        {GROUP_IDS.map((g) => {
          const order = CONFIRMED_GROUP_RANKINGS[g];
          const isThird = CONFIRMED_THIRD_QUALIFIERS.includes(g);
          return (
            <div key={g}>
              <p className="mb-1 text-xs font-bold text-muted">グループ {g}</p>
              <div className="space-y-1">
                {order.map((teamId, i) => (
                  <div key={teamId} className="flex items-center gap-2 text-sm">
                    <span
                      className={cn(
                        "w-9 shrink-0 rounded text-center text-[10px] font-bold leading-5",
                        i === 0
                          ? "bg-amber-100 text-amber-700"
                          : i === 1
                            ? "bg-line text-muted"
                            : "bg-bg text-muted",
                      )}
                    >
                      {RANK_CHIP[i]}
                    </span>
                    <TeamBadge teamId={teamId} size="sm" />
                    {i === 2 && isThird && (
                      <span className="rounded-full bg-brand-soft px-2 py-0.5 text-[10px] font-bold text-brand-deep">
                        通過
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </details>
  );
}
