import { cn } from "@/lib/cn";

export function Card({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-3xl bg-surface p-5 shadow-soft",
        className,
      )}
      {...props}
    />
  );
}
