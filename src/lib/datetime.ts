// 日時整形（ローカルタイムゾーン）。履歴の「M月D日 HH:MM に作成した予想」表示用。
export function formatJaDateTime(ms: number): string {
  const d = new Date(ms);
  const month = d.getMonth() + 1;
  const day = d.getDate();
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${month}月${day}日 ${hh}:${mm}`;
}
