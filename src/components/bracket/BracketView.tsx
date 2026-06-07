import type { Round, TeamId } from "@/domain/types";
import { MATCHES } from "@/domain/bracket/r32-template";
import type { ResolvedBracket } from "@/domain/bracket/generateR32";
import { MatchCard } from "./MatchCard";

const ROUND_ORDER: Round[] = ["R32", "R16", "QF", "SF", "THIRD", "FINAL"];
const ROUND_TITLE: Record<Round, string> = {
  R32: "ベスト32",
  R16: "ベスト16",
  QF: "準々決勝",
  SF: "準決勝",
  THIRD: "3位決定戦",
  FINAL: "決勝",
};

/** ラウンドごとにMatchCardを並べる。onPick省略で読み取り専用。 */
export function BracketView({
  bracket,
  onPick,
  highlightId,
}: {
  bracket: ResolvedBracket;
  onPick?: (matchId: number, teamId: TeamId) => void;
  highlightId?: number | null;
}) {
  return (
    <div className="space-y-6">
      {ROUND_ORDER.map((round) => {
        const matches = MATCHES.filter((m) => m.round === round);
        const decided = matches.filter(
          (m) => bracket.get(m.id)?.winner != null,
        ).length;
        return (
          <section key={round}>
            <header className="mb-2 flex items-baseline justify-between">
              <h2 className="text-sm font-bold text-ink">
                {ROUND_TITLE[round]}
              </h2>
              <span className="text-xs text-muted">
                {decided}/{matches.length}
              </span>
            </header>
            <div className="space-y-2">
              {matches.map((m) => {
                const rm = bracket.get(m.id);
                if (!rm) return null;
                return (
                  <MatchCard
                    key={m.id}
                    match={rm}
                    highlight={Boolean(onPick) && highlightId === m.id}
                    onPick={onPick}
                  />
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}
