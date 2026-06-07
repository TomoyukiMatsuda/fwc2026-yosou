// ============================================================================
// ドメイン共通型（React/Next/Cloudflare 非依存の純TS）
// UI・サーバ両方から import される。重い依存を持ち込まない。
// ============================================================================

/** 12グループの識別子（A〜L） */
export type GroupId =
  | "A" | "B" | "C" | "D" | "E" | "F"
  | "G" | "H" | "I" | "J" | "K" | "L";

/** 全グループIDを抽選順（A→L）で並べた配列 */
export const GROUP_IDS: GroupId[] = [
  "A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L",
];

/** チームの安定ID（3文字程度のユニークコード。例: "MEX", "ESP"） */
export type TeamId = string;

/** 大陸連盟 */
export type Confederation =
  | "UEFA" | "CONMEBOL" | "CONCACAF" | "CAF" | "AFC" | "OFC";

/** チーム（出場48カ国） */
export interface Team {
  /** 安定したユニークID。グループ表・予想ペイロードの参照キー */
  id: TeamId;
  /** 日本語表示名（例: メキシコ） */
  nameJa: string;
  /** 英語名（例: Mexico） */
  nameEn: string;
  /**
   * 国旗絵文字に変換するためのコード。
   * 通常は ISO 3166-1 alpha-2 小文字（例: "mx"）。
   * イングランド/スコットランド/ウェールズは "eng"/"sco"/"wal" の特例トークン。
   * @see lib/flag.ts codeToEmoji
   */
  code: string;
  /** 所属連盟 */
  confederation: Confederation;
}

/** グループ（4チーム） */
export interface Group {
  id: GroupId;
  /** 抽選ポット順（index0 = pot1シード）に並べた4チームのID */
  teamIds: TeamId[];
}

/** トーナメントのラウンド種別 */
export type Round = "R32" | "R16" | "QF" | "SF" | "THIRD" | "FINAL";

/**
 * 各ラウンドの「到達」を表す数値（採点の到達ラウンド方式で使用）。
 * グループ突破=0 とし、ノックアウトの勝ち上がりで増える。
 * R32出場(=GL突破)=1 … 決勝進出=5。優勝は別途+αで評価。
 */
export const ROUND_REACH: Record<Round, number> = {
  R32: 1,
  R16: 2,
  QF: 3,
  SF: 4,
  THIRD: 4, // 3位決定戦はSF敗退組なので到達度はSFと同じ
  FINAL: 5,
};
