import type { GroupId, Round } from "@/domain/types";

// ============================================================================
// ブラケット（トーナメント表）の構造を表す型
// ============================================================================

/**
 * 1つの対戦スロット（対戦カードの片側）の出所定義。
 * 「A組1位」「3位（候補群のいずれか）」「前試合の勝者/敗者」を表現する。
 */
export type BracketSlot =
  /** あるグループの1位 */
  | { kind: "winner"; group: GroupId }
  /** あるグループの2位 */
  | { kind: "runnerUp"; group: GroupId }
  /** 3位通過チーム（どのグループの3位が入るかは candidates の中から割当） */
  | { kind: "third"; candidates: GroupId[] }
  /** 指定matchの勝者 */
  | { kind: "matchWinner"; matchId: number }
  /** 指定matchの敗者（3位決定戦で使用） */
  | { kind: "matchLoser"; matchId: number };

/** トーナメント表の1試合分のテンプレート（チーム未確定の骨格） */
export interface MatchTemplate {
  /** 公式マッチ番号（73〜104） */
  id: number;
  round: Round;
  /** 対戦カードの一方（表示上は上側） */
  slotA: BracketSlot;
  /** 対戦カードの他方（表示上は下側） */
  slotB: BracketSlot;
  /** 表示用ラベル（例: "ベスト16"） */
  roundLabel: string;
}
