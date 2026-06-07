import type { Team, TeamId } from "@/domain/types";

// ============================================================================
// 出場48カ国の確定データ
//
// 出典: Wikipedia "2026 FIFA World Cup draw" / MLSSoccer / 各グループ専用ページ。
// 調査・照合日: 2026-06-07（抽選2025-12-05 + プレーオフ2026-03-31 すべて確定済み）。
// 2独立ソースでロスター照合、48チーム重複なし・開催国シード整合を検算済み。
//
// id: FIFA式3文字コード（安定・ユニーク・参照キー）
// code: 国旗絵文字用。通常ISO 3166-1 alpha-2小文字。eng/sco は特例トークン。
// ============================================================================

/** グループ順（A→L）× スロット順（1→4）で並べた全48チーム */
export const TEAM_LIST: Team[] = [
  // Group A
  { id: "MEX", nameJa: "メキシコ", nameEn: "Mexico", code: "mx", confederation: "CONCACAF" },
  { id: "RSA", nameJa: "南アフリカ", nameEn: "South Africa", code: "za", confederation: "CAF" },
  { id: "KOR", nameJa: "韓国", nameEn: "South Korea", code: "kr", confederation: "AFC" },
  { id: "CZE", nameJa: "チェコ", nameEn: "Czech Republic", code: "cz", confederation: "UEFA" },
  // Group B
  { id: "CAN", nameJa: "カナダ", nameEn: "Canada", code: "ca", confederation: "CONCACAF" },
  { id: "BIH", nameJa: "ボスニア・ヘルツェゴビナ", nameEn: "Bosnia and Herzegovina", code: "ba", confederation: "UEFA" },
  { id: "QAT", nameJa: "カタール", nameEn: "Qatar", code: "qa", confederation: "AFC" },
  { id: "SUI", nameJa: "スイス", nameEn: "Switzerland", code: "ch", confederation: "UEFA" },
  // Group C
  { id: "BRA", nameJa: "ブラジル", nameEn: "Brazil", code: "br", confederation: "CONMEBOL" },
  { id: "MAR", nameJa: "モロッコ", nameEn: "Morocco", code: "ma", confederation: "CAF" },
  { id: "HAI", nameJa: "ハイチ", nameEn: "Haiti", code: "ht", confederation: "CONCACAF" },
  { id: "SCO", nameJa: "スコットランド", nameEn: "Scotland", code: "sco", confederation: "UEFA" },
  // Group D
  { id: "USA", nameJa: "アメリカ", nameEn: "United States", code: "us", confederation: "CONCACAF" },
  { id: "PAR", nameJa: "パラグアイ", nameEn: "Paraguay", code: "py", confederation: "CONMEBOL" },
  { id: "AUS", nameJa: "オーストラリア", nameEn: "Australia", code: "au", confederation: "AFC" },
  { id: "TUR", nameJa: "トルコ", nameEn: "Turkey", code: "tr", confederation: "UEFA" },
  // Group E
  { id: "GER", nameJa: "ドイツ", nameEn: "Germany", code: "de", confederation: "UEFA" },
  { id: "CUW", nameJa: "キュラソー", nameEn: "Curaçao", code: "cw", confederation: "CONCACAF" },
  { id: "CIV", nameJa: "コートジボワール", nameEn: "Ivory Coast", code: "ci", confederation: "CAF" },
  { id: "ECU", nameJa: "エクアドル", nameEn: "Ecuador", code: "ec", confederation: "CONMEBOL" },
  // Group F
  { id: "NED", nameJa: "オランダ", nameEn: "Netherlands", code: "nl", confederation: "UEFA" },
  { id: "JPN", nameJa: "日本", nameEn: "Japan", code: "jp", confederation: "AFC" },
  { id: "SWE", nameJa: "スウェーデン", nameEn: "Sweden", code: "se", confederation: "UEFA" },
  { id: "TUN", nameJa: "チュニジア", nameEn: "Tunisia", code: "tn", confederation: "CAF" },
  // Group G
  { id: "BEL", nameJa: "ベルギー", nameEn: "Belgium", code: "be", confederation: "UEFA" },
  { id: "EGY", nameJa: "エジプト", nameEn: "Egypt", code: "eg", confederation: "CAF" },
  { id: "IRN", nameJa: "イラン", nameEn: "Iran", code: "ir", confederation: "AFC" },
  { id: "NZL", nameJa: "ニュージーランド", nameEn: "New Zealand", code: "nz", confederation: "OFC" },
  // Group H
  { id: "ESP", nameJa: "スペイン", nameEn: "Spain", code: "es", confederation: "UEFA" },
  { id: "CPV", nameJa: "カーボベルデ", nameEn: "Cape Verde", code: "cv", confederation: "CAF" },
  { id: "KSA", nameJa: "サウジアラビア", nameEn: "Saudi Arabia", code: "sa", confederation: "AFC" },
  { id: "URU", nameJa: "ウルグアイ", nameEn: "Uruguay", code: "uy", confederation: "CONMEBOL" },
  // Group I
  { id: "FRA", nameJa: "フランス", nameEn: "France", code: "fr", confederation: "UEFA" },
  { id: "SEN", nameJa: "セネガル", nameEn: "Senegal", code: "sn", confederation: "CAF" },
  { id: "IRQ", nameJa: "イラク", nameEn: "Iraq", code: "iq", confederation: "AFC" },
  { id: "NOR", nameJa: "ノルウェー", nameEn: "Norway", code: "no", confederation: "UEFA" },
  // Group J
  { id: "ARG", nameJa: "アルゼンチン", nameEn: "Argentina", code: "ar", confederation: "CONMEBOL" },
  { id: "ALG", nameJa: "アルジェリア", nameEn: "Algeria", code: "dz", confederation: "CAF" },
  { id: "AUT", nameJa: "オーストリア", nameEn: "Austria", code: "at", confederation: "UEFA" },
  { id: "JOR", nameJa: "ヨルダン", nameEn: "Jordan", code: "jo", confederation: "AFC" },
  // Group K
  { id: "POR", nameJa: "ポルトガル", nameEn: "Portugal", code: "pt", confederation: "UEFA" },
  { id: "COD", nameJa: "コンゴ民主共和国", nameEn: "DR Congo", code: "cd", confederation: "CAF" },
  { id: "UZB", nameJa: "ウズベキスタン", nameEn: "Uzbekistan", code: "uz", confederation: "AFC" },
  { id: "COL", nameJa: "コロンビア", nameEn: "Colombia", code: "co", confederation: "CONMEBOL" },
  // Group L
  { id: "ENG", nameJa: "イングランド", nameEn: "England", code: "eng", confederation: "UEFA" },
  { id: "CRO", nameJa: "クロアチア", nameEn: "Croatia", code: "hr", confederation: "UEFA" },
  { id: "GHA", nameJa: "ガーナ", nameEn: "Ghana", code: "gh", confederation: "CAF" },
  { id: "PAN", nameJa: "パナマ", nameEn: "Panama", code: "pa", confederation: "CONCACAF" },
];

/** TeamId → Team の高速参照 */
export const TEAMS: Record<TeamId, Team> = Object.fromEntries(
  TEAM_LIST.map((team) => [team.id, team]),
);

/** チーム取得（未知IDは undefined） */
export function getTeam(id: TeamId | null | undefined): Team | undefined {
  return id ? TEAMS[id] : undefined;
}
