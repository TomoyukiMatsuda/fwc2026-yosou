import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "ghost";

const VARIANTS: Record<Variant, string> = {
  primary:
    "bg-brand text-brand-ink shadow-sm active:scale-[0.98] disabled:bg-slate-300 disabled:text-white disabled:shadow-none disabled:active:scale-100",
  secondary:
    "bg-surface text-ink border border-line active:scale-[0.98] disabled:opacity-50",
  ghost: "bg-transparent text-muted active:bg-slate-100",
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
        "inline-flex items-center justify-center gap-2 rounded-2xl px-5 py-3.5 text-base font-bold transition select-none disabled:cursor-not-allowed",
        fullWidth && "w-full",
        VARIANTS[variant],
        className,
      )}
      {...props}
    />
  );
}
