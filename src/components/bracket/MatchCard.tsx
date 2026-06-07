import type { TeamId } from "@/domain/types";
import type { ResolvedMatch } from "@/domain/bracket/generateR32";
import { TeamBadge } from "@/components/TeamBadge";
import { cn } from "@/lib/cn";

function TeamRow({
  teamId,
  isWinner,
  dim,
  side,
  onPick,
}: {
  teamId: TeamId | null;
  isWinner: boolean;
  dim: boolean;
  side: "A" | "B";
  /** 省略時は読み取り専用（タップ不可） */
  onPick?: (teamId: TeamId) => void;
}) {
  const interactive = Boolean(onPick && teamId);
  const content = (
    <>
      <TeamBadge teamId={teamId} size="sm" />
      <span
        className={cn(
          "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[11px] font-bold",
          isWinner
            ? "border-brand bg-brand text-brand-ink"
            : "border-slate-300 text-transparent",
        )}
        aria-hidden
      >
        ✓
      </span>
    </>
  );
  const className = cn(
    "flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left transition",
    isWinner && "bg-brand/10",
    dim && "opacity-40",
    interactive && !isWinner && "active:bg-slate-50",
  );

  if (!onPick) {
    return <div className={className}>{content}</div>;
  }
  return (
    <button
      type="button"
      data-side={side}
      disabled={!teamId}
      onClick={() => teamId && onPick(teamId)}
      className={className}
    >
      {content}
    </button>
  );
}

/** 1試合カード。onPick省略で読み取り専用（共有ページのSSRでも使える）。 */
export function MatchCard({
  match,
  highlight,
  onPick,
}: {
  match: ResolvedMatch;
  highlight?: boolean;
  onPick?: (matchId: number, teamId: TeamId) => void;
}) {
  const { teamA, teamB, winner, ready } = match;
  const pick = onPick ? (teamId: TeamId) => onPick(match.id, teamId) : undefined;

  return (
    <div
      data-testid="match"
      data-mid={match.id}
      data-ready={ready}
      data-decided={winner != null}
      className={cn(
        "overflow-hidden rounded-xl border bg-surface transition",
        highlight ? "border-brand ring-2 ring-brand/20" : "border-line",
        !ready && "opacity-60",
      )}
    >
      <TeamRow
        teamId={teamA}
        side="A"
        isWinner={winner != null && winner === teamA}
        dim={winner != null && winner !== teamA}
        onPick={pick}
      />
      <div className="h-px bg-line" />
      <TeamRow
        teamId={teamB}
        side="B"
        isWinner={winner != null && winner === teamB}
        dim={winner != null && winner !== teamB}
        onPick={pick}
      />
    </div>
  );
}
