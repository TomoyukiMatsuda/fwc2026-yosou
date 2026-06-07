import type { TeamId } from "@/domain/types";
import { getTeam } from "@/domain/data/teams";
import { codeToEmoji } from "@/lib/flag";
import { cn } from "@/lib/cn";

type Size = "sm" | "md" | "lg";

const FLAG_SIZE: Record<Size, string> = {
  sm: "text-lg",
  md: "text-2xl",
  lg: "text-3xl",
};
const NAME_SIZE: Record<Size, string> = {
  sm: "text-sm",
  md: "text-base",
  lg: "text-lg font-bold",
};

/** 国旗(絵文字) + 国名。teamId が null/未知なら「未定」プレースホルダ。 */
export function TeamBadge({
  teamId,
  size = "md",
  showName = true,
  className,
}: {
  teamId: TeamId | null | undefined;
  size?: Size;
  showName?: boolean;
  className?: string;
}) {
  const team = getTeam(teamId);
  if (!team) {
    return (
      <span className={cn("inline-flex items-center gap-2 text-muted", className)}>
        <span className={FLAG_SIZE[size]} aria-hidden>
          ⚪️
        </span>
        {showName && <span className={NAME_SIZE[size]}>未定</span>}
      </span>
    );
  }
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <span className={FLAG_SIZE[size]} aria-hidden>
        {codeToEmoji(team.code)}
      </span>
      {showName && (
        <span className={cn(NAME_SIZE[size], "text-ink")}>{team.nameJa}</span>
      )}
    </span>
  );
}
