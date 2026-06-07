import type { GroupId, Round } from "@/domain/types";
import type { BracketSlot, MatchTemplate } from "./types";

// ============================================================================
// 2026 FIFA W杯 ノックアウト経路テンプレート（マッチ73〜104）
//
// 出典: Wikipedia "2026 FIFA World Cup knockout stage"（公式レギュレーション由来）
// 取得日: 2026-06-07 / 調査エージェントで二次照合済み。
//
// ⚠️ 友人に出す前に対戦カードを公式確定版で最終確認すること（プラン記載の必須検証）。
//
// 設計: 各試合は2つの BracketSlot（出所）で定義。実チームは
//   generateR32.ts の resolveBracket() が groupRankings/3位割当/勝者pick から解決する。
// ============================================================================

// --- スロット生成のショートハンド ---
const w = (group: GroupId): BracketSlot => ({ kind: "winner", group });
const r = (group: GroupId): BracketSlot => ({ kind: "runnerUp", group });
const t = (candidates: GroupId[]): BracketSlot => ({ kind: "third", candidates });
const mw = (matchId: number): BracketSlot => ({ kind: "matchWinner", matchId });
const ml = (matchId: number): BracketSlot => ({ kind: "matchLoser", matchId });

const LABEL: Record<Round, string> = {
  R32: "ベスト32",
  R16: "ベスト16",
  QF: "準々決勝",
  SF: "準決勝",
  THIRD: "3位決定戦",
  FINAL: "決勝",
};

function m(
  id: number,
  round: Round,
  slotA: BracketSlot,
  slotB: BracketSlot,
): MatchTemplate {
  return { id, round, slotA, slotB, roundLabel: LABEL[round] };
}

/** 全32試合のテンプレート（マッチ番号昇順 = トポロジカル順）。 */
export const MATCHES: MatchTemplate[] = [
  // ---- ベスト32（73〜88） ----
  m(73, "R32", r("A"), r("B")),
  m(74, "R32", w("E"), t(["A", "B", "C", "D", "F"])),
  m(75, "R32", w("F"), r("C")),
  m(76, "R32", w("C"), r("F")),
  m(77, "R32", w("I"), t(["C", "D", "F", "G", "H"])),
  m(78, "R32", r("E"), r("I")),
  m(79, "R32", w("A"), t(["C", "E", "F", "H", "I"])),
  m(80, "R32", w("L"), t(["E", "H", "I", "J", "K"])),
  m(81, "R32", w("D"), t(["B", "E", "F", "I", "J"])),
  m(82, "R32", w("G"), t(["A", "E", "H", "I", "J"])),
  m(83, "R32", r("K"), r("L")),
  m(84, "R32", w("H"), r("J")),
  m(85, "R32", w("B"), t(["E", "F", "G", "I", "J"])),
  m(86, "R32", w("J"), r("H")),
  m(87, "R32", w("K"), t(["D", "E", "I", "J", "L"])),
  m(88, "R32", r("D"), r("G")),

  // ---- ベスト16（89〜96） ----
  m(89, "R16", mw(74), mw(77)),
  m(90, "R16", mw(73), mw(75)),
  m(91, "R16", mw(76), mw(78)),
  m(92, "R16", mw(79), mw(80)),
  m(93, "R16", mw(83), mw(84)),
  m(94, "R16", mw(81), mw(82)),
  m(95, "R16", mw(86), mw(88)),
  m(96, "R16", mw(85), mw(87)),

  // ---- 準々決勝（97〜100） ----
  m(97, "QF", mw(89), mw(90)),
  m(98, "QF", mw(93), mw(94)),
  m(99, "QF", mw(91), mw(92)),
  m(100, "QF", mw(95), mw(96)),

  // ---- 準決勝（101〜102） ----
  m(101, "SF", mw(97), mw(98)),
  m(102, "SF", mw(99), mw(100)),

  // ---- 3位決定戦（103）/ 決勝（104） ----
  m(103, "THIRD", ml(101), ml(102)),
  m(104, "FINAL", mw(101), mw(102)),
];

// --- 派生インデックス ---

/** matchId → テンプレート の高速参照 */
export const MATCH_BY_ID: Map<number, MatchTemplate> = new Map(
  MATCHES.map((mt) => [mt.id, mt]),
);

/** 3位通過チームを受け入れるスロットを持つ試合ID群（昇順）。ちょうど8つ。 */
export const THIRD_PLACE_MATCH_IDS: number[] = MATCHES.filter(
  (mt) => mt.slotA.kind === "third" || mt.slotB.kind === "third",
).map((mt) => mt.id);

/** 各試合が「3位スロットに受け入れ可能な候補グループ」 */
export const THIRD_SLOT_CANDIDATES: Record<number, GroupId[]> =
  Object.fromEntries(
    MATCHES.flatMap((mt) =>
      [mt.slotA, mt.slotB]
        .filter((s): s is Extract<BracketSlot, { kind: "third" }> =>
          s.kind === "third",
        )
        .map((s) => [mt.id, s.candidates] as const),
    ),
  );

/**
 * 「ある試合の結果（勝者/敗者）を入力として使う下流試合」の隣接リスト。
 * matchId → その勝敗を参照する下流 matchId[]。カスケード無効化に使用。
 */
export const DOWNSTREAM_OF: Map<number, number[]> = (() => {
  const map = new Map<number, number[]>();
  for (const mt of MATCHES) {
    for (const slot of [mt.slotA, mt.slotB]) {
      if (slot.kind === "matchWinner" || slot.kind === "matchLoser") {
        const arr = map.get(slot.matchId) ?? [];
        arr.push(mt.id);
        map.set(slot.matchId, arr);
      }
    }
  }
  return map;
})();

/** ノックアウト全試合IDの昇順配列（73..104） */
export const ALL_MATCH_IDS: number[] = MATCHES.map((mt) => mt.id);
