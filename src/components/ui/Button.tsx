import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "ghost";

const VARIANTS: Record<Variant, string> = {
  primary:
    "bg-brand text-brand-ink shadow-soft active:scale-[0.98] active:shadow-soft-lg disabled:bg-line disabled:text-muted disabled:shadow-none disabled:active:scale-100",
  secondary:
    "bg-surface text-ink shadow-soft active:scale-[0.98] disabled:opacity-50 disabled:shadow-none",
  ghost: "bg-transparent text-muted active:bg-brand-soft/50",
};

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  fullWidth?: boolean;
}

export function Button({
  variant = "primary",
  fullWidth,
  className,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-2xl px-5 py-3.5 text-base font-bold transition-[transform,box-shadow,background-color] select-none disabled:cursor-not-allowed",
        fullWidth && "w-full",
        VARIANTS[variant],
        className,
      )}
      {...props}
    />
  );
}
