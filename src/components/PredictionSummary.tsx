import type { PredictionState } from "@/domain/prediction/types";
import type { ResolvedBracket } from "@/domain/bracket/generateR32";
import { getStandings } from "@/domain/prediction/selectors";
import { GROUP_IDS } from "@/domain/types";
import { TeamBadge } from "@/components/TeamBadge";
import { BracketView } from "@/components/bracket/BracketView";
import { cn } from "@/lib/cn";

const PODIUM = [
  { key: "runnerUp", label: "準優勝", medal: "🥈" },
  { key: "third", label: "3位", medal: "🥉" },
  { key: "fourth", label: "4位", medal: "4" },
] as const;

const RANK_CHIP = ["1位", "2位", "3位", "4位"];

/** 予想結果の読み取り専用サマリ（サマリーステップと共有ページで共用）。 */
export function PredictionSummary({
  state,
  bracket,
  nickname,
}: {
  state: PredictionState;
  bracket: ResolvedBracket;
  nickname?: string | null;
}) {
  const standings = getStandings(bracket);

  return (
    <div className="space-y-5">
      {nickname && (
        <p className="text-center text-sm font-semibold text-muted">
          {nickname}さんの予想
        </p>
      )}

      {/* 優勝 */}
      <div className="rounded-3xl bg-gradient-to-b from-amber-50 to-surface p-6 text-center shadow-soft">
        <div className="text-4xl" aria-hidden>
          🏆
        </div>
        <p className="mt-1 text-xs font-bold tracking-widest text-amber-600">
          優勝
        </p>
        <div className="mt-2 flex justify-center" data-testid="champion">
          <TeamBadge teamId={standings.champion} size="lg" />
        </div>
      </div>

      {/* 準優勝・3位・4位 */}
      <div className="grid grid-cols-3 gap-2">
        {PODIUM.map((p) => (
          <div
            key={p.key}
            className="flex flex-col items-center gap-1 rounded-2xl bg-surface px-2 py-3 text-center shadow-soft"
          >
            <span className="text-lg" aria-hidden>
              {p.medal}
            </span>
            <span className="text-[10px] font-bold text-muted">{p.label}</span>
            <TeamBadge teamId={standings[p.key]} size="sm" showName />
          </div>
        ))}
      </div>

      {/* グループリーグ結果 */}
      <details className="rounded-3xl bg-surface shadow-soft">
        <summary className="cursor-pointer px-4 py-3 text-sm font-bold text-ink">
          グループリーグの予想
        </summary>
        <div className="space-y-3 px-4 pb-4">
          {GROUP_IDS.map((g) => {
            const order = state.groupRankings[g] ?? [];
            const isThird = state.thirdPlaceQualifiers.includes(g);
            return (
              <div key={g}>
                <p className="mb-1 text-xs font-bold text-muted">
                  グループ {g}
                </p>
                <div className="space-y-1">
                  {order.map((teamId, i) => (
                    <div
                      key={teamId}
                      className="flex items-center gap-2 text-sm"
                    >
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

      {/* トーナメント表 */}
      <details className="rounded-3xl bg-surface shadow-soft">
        <summary className="cursor-pointer px-4 py-3 text-sm font-bold text-ink">
          トーナメント表
        </summary>
        <div className="px-4 pb-4">
          <BracketView bracket={bracket} />
        </div>
      </details>
    </div>
  );
}
