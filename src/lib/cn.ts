/** 条件付きクラス名を連結する最小ユーティリティ（外部依存なし）。 */
export function cn(
  ...parts: Array<string | false | null | undefined>
): string {
  return parts.filter(Boolean).join(" ");
}
