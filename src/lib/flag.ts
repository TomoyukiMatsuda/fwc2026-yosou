// ============================================================================
// 国コード → 国旗絵文字（画像同梱ゼロ = Workerバンドル軽量化）
// ============================================================================

/** サブディビジョン旗（イングランド等）をタグシーケンスから生成 */
function tagFlag(subdivision: string): string {
  const TAG_BASE = 0xe0000;
  let s = String.fromCodePoint(0x1f3f4); // 黒い旗
  for (const ch of subdivision) {
    s += String.fromCodePoint(TAG_BASE + ch.charCodeAt(0));
  }
  s += String.fromCodePoint(0xe007f); // タグ終端
  return s;
}

/** 特例: 地域旗（ISO2では表現できない） */
const SPECIAL: Record<string, string> = {
  eng: tagFlag("gbeng"), // イングランド
  sco: tagFlag("gbsct"), // スコットランド
  wal: tagFlag("gbwls"), // ウェールズ
};

const REGIONAL_A = 0x1f1e6; // 🇦
const LOWER_A = "a".charCodeAt(0);

/**
 * 国コードを国旗絵文字に変換。
 * - "mx" 等 ISO 3166-1 alpha-2 → 地域指示記号2文字
 * - "eng"/"sco"/"wal" → 地域旗の特例
 * - 不明 → 白旗
 */
export function codeToEmoji(code: string): string {
  const c = code.toLowerCase();
  if (SPECIAL[c]) return SPECIAL[c];
  if (!/^[a-z]{2}$/.test(c)) return "🏳️";
  return String.fromCodePoint(
    REGIONAL_A + (c.charCodeAt(0) - LOWER_A),
    REGIONAL_A + (c.charCodeAt(1) - LOWER_A),
  );
}
