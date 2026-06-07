# 2026 FIFA W杯 勝ち抜き予想アプリ 実装プラン

## Context（背景と目的）

- **なぜ作るか**：2026 FIFA W杯（2026/6/11開幕・米加墨共催・**史上初の48チーム制**）を、友人と楽しむための個人開発アプリ。グループリーグ〜トーナメント〜優勝まで「順々に答えると全予想が完結する」ウィザード体験を提供する。
- **解く課題**：ログイン不要で手軽に予想でき、完成した予想をURLで共有できるものが欲しい。2026は過去大会と構造が全く違う（12組×4／各組1・2位＋3位上位8＝32／ベスト32開始）ため、専用設計が要る。
- **制約**：開幕目前で高速開発。サーバーは無料で完結。デザイン・機能ともシンプル。モバイルファースト。
- **意図する成果**：
  1. **ローカルで予想を最後まで完結できる**（最優先・localStorageで途中復帰可）
  2. 完成予想を **URL（`/p/{id}`）で限定共有** できる
  3. 将来、実結果で **自動採点・ランキング** できる（DBは拡張可能に作る）

## 確定仕様（ユーザー合意済み）

| 項目 | 内容 |
|---|---|
| 予想フロー | GL順位（12組×1〜4位を直接指定）→ 3位通過8チーム選択 → R32〜決勝＋3位決定戦の勝者選択 → 完了サマリ |
| 予想範囲 | ベスト4まで（優勝/準優勝/3位/4位を確定） |
| 保存 | localStorage下書き（途中離脱→復帰） |
| 共有 | 完成予想をD1保存→`/p/{id}` で**URLを知る人だけ閲覧**（一覧公開はしない） |
| 採点 | 到達ラウンド方式。**MVP後（M4）に実装**。ランキングの単位（ルーム/グループ制等）は後で設計するが、**DBは拡張しやすい形にしておく** |
| デザイン | クリーン×ミニマル／モバイルファースト |
| ニックネーム | 共有時に任意入力（識別・将来のランキング表示用） |

## 技術構成（公式ドキュメントで確定）

- **Next.js (App Router) + TypeScript + Tailwind CSS**
- **`@opennextjs/cloudflare`（OpenNext）→ Cloudflare Workers** にデプロイ（Pagesではない／現行推奨）
- **D1 (SQLite) + Drizzle ORM**。Route Handler/Server Componentから `getCloudflareContext()` で `env.DB` 取得
- **状態管理：`useSyncExternalStore`（React公式API）+ 自前の軽量ストア**（subscribe / getSnapshot / dispatch）。状態管理ライブラリ（Zustand等）は導入しない（＝Zustandが内部で使う仕組みを公式APIで最小実装し、挙動を透明に保つ）
- **データ取得：Server ComponentでD1直読み／保存は単発 `fetch()`**。SWR・TanStack Query等のデータフェッチライブラリも導入しない（クライアントでサーバーデータをキャッシュ・再検証する用途がないため。将来必要になれば再検討）
- 追加依存は **nanoid**（共有ID生成）と **zod**（外部から来るpayloadの検証）の最小限のみ
- 初期化：`npm create cloudflare@latest`（C3, `--framework=next`）
- **コスト**：友人数十人規模は Workers無料枠(10万req/日)・D1無料枠(5GB) に対し利用1%未満＝**完全無料**

---

## アーキテクチャ設計

### ディレクトリ構成（src配下）

```
src/
├── app/
│   ├── page.tsx                  # ランディング（「予想をはじめる」）
│   ├── predict/page.tsx          # ★ウィザード本体（'use client'・全ステップ分岐）
│   ├── p/[id]/page.tsx           # 共有閲覧（Server Component・D1からSSR）
│   └── api/predictions/
│       ├── route.ts              # POST: 予想保存→{id}
│       └── [id]/route.ts         # GET: 1件取得（保険／SSRが主）
├── components/
│   ├── ui/                       # Button/Card/Chip/ProgressBar（ミニマル原子）
│   ├── wizard/                   # WizardShell, StepGroupRanking, StepThirdPlace, StepKnockout, StepSummary
│   ├── bracket/                  # BracketView, MatchCard
│   └── TeamBadge.tsx             # 国旗(絵文字)+国名
├── domain/                       # ★純TS（React/Next/CF非依存・テスト容易・Worker軽量）
│   ├── types.ts
│   ├── data/                     # teams.ts / groups.ts / schedule.ts（確定データ同梱）
│   ├── bracket/                  # r32-template.ts / generateR32.ts / advance.ts / thirdPlace.ts
│   ├── prediction/               # types.ts / schema.ts(zod) / reducer.ts(状態遷移+依存無効化) / serialize.ts
│   └── scoring/score.ts          # 到達ラウンド採点（M4）
├── state/
│   ├── predictionStore.ts        # 自前ストア（state+listeners+subscribe+getSnapshot+dispatch）。reducerはdomain/prediction/reducer.ts。localStorage同期もここ
│   └── usePrediction.ts          # useSyncExternalStore ラッパー（getServerSnapshotでSSR対応）
├── db/
│   ├── schema.ts                 # Drizzle テーブル定義
│   └── client.ts                 # getDb() = drizzle(env.DB)
└── lib/                          # id.ts(nanoid) / flag.ts(codeToEmoji) / cn.ts
```

**原則：`src/domain` は環境非依存の純TS。** UI・サーバ両方から呼べ、Workerバンドルに余計な依存を持ち込まない。

### 状態モデル（難所①：依存の再計算）

**「真実」は3つだけ。派生は都度計算で導出（stateに保存しない）** ＝前段変更で後段が壊れない構造的保証。

```ts
interface PredictionState {
  schemaVersion: 1;
  groupRankings: Record<GroupId, [TeamId,TeamId,TeamId,TeamId]>; // 1位..4位
  thirdPlaceQualifiers: TeamId[];        // 0..8（通過する3位）
  knockoutPicks: Record<number, TeamId>; // matchId(73..104)→勝者
  wizard: { step: 'GROUP'|'THIRD'|'KNOCKOUT'|'SUMMARY'; groupCursor: number; completedSteps: string[] };
  meta: { updatedAt: number };
}
```

- 1位/2位/3位リスト・R32対戦表・4強は **派生関数（`domain/`の純関数）＋ `useMemo` で導出**。
- **実装：`useSyncExternalStore` + 自前の軽量ストア。** データフロー＝`dispatch(action)` → `reducer`（domain純関数）→ 新state → listeners通知 → 購読中コンポーネントだけ再レンダー。状態管理ライブラリは使わず、Zustandが内部で使う仕組み（外部ストア＋`useSyncExternalStore`）を公式APIで最小実装する＝魔法がなく挙動が全部見える。
  - **Provider不要**（storeはモジュールシングルトン）。`usePrediction()` で読み、`dispatch()` で更新。
  - **localStorage**：dispatch時にstoreがsetItem、起動時getItemで復元。`getServerSnapshot` はデフォルト状態を返し**SSRハイドレーション安全**（Context+useEffect方式より構造的に堅牢）。
  - **注意**：reducerはimmutable更新（未変更時 `getSnapshot` が同一参照を返し無限ループ回避）。複合オブジェクトをselectで返す最適化が要る箇所のみ `use-sync-external-store/shim/with-selector` を使用（MVPはstore全体購読＋必要分読みで十分／ステップ式UIで再描画の実害小）。
- **無効化（invalidate）は差分削除**：GL/3位を後から変えたら、矛盾する下流pickだけ削除（`pick.teamId` が現対戦カードの2チームに含まれるか検証）。knockoutは `feedsTo` を辿ってカスケード削除。reducer内で実施。
  - **M1は素朴版**（矛盾pick削除＋トースト通知）で出荷 → M3で最小カスケードに洗練。

### データモデル（D1 / Drizzle）

**予想本体はJSON 1カラム＋ランキング用に非正規化カラム少数**（部分検索要件がないので正規化は過剰）。

```ts
// src/db/schema.ts
export const predictions = sqliteTable('predictions', {
  id: text('id').primaryKey(),                              // nanoid 10文字
  nickname: text('nickname'),                               // 任意
  payload: text('payload', { mode: 'json' }).$type<SharedPayloadV1>().notNull(),
  championTeamId: text('champion_team_id').notNull(),       // 非正規化（一覧/採点高速化）
  score: integer('score'),                                  // M4で更新（未採点はnull）
  scoredAt: integer('scored_at', { mode: 'timestamp_ms' }),
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).$defaultFn(() => new Date()).notNull(),
}, (t) => ({ scoreIdx: index('idx_pred_score').on(t.score) }));
```

- **正確性メモ**：SQLiteに`datetime`型は無い→`integer({mode:'timestamp_ms'})`。JSONは`text({mode:'json'}).$type<T>()`。デフォルト値は`.$defaultFn(() => new Date())`（DB依存を避ける）。
- **共有ID**：`nanoid` 10文字・紛らわしい文字(0/O/1/l/I)除外のカスタムアルファベット（連番・UUIDを回避）。
- **将来のランキング拡張**：ルーム/グループ制を採る場合は `room_id` 列をマイグレーションで追加（予想テーブルは独立しているので後付け容易）。
- **クライアント**：`getDb()` は**必ずリクエストスコープ内**で `getCloudflareContext()` を呼ぶ（トップレベルI/O禁止）。

### トーナメント生成（難所②）

2026公式の **R32〜決勝の勝ち上がり経路（マッチ73〜104）をコード定数化**。`BracketSlot` で「A組1位」「3位(候補群)」「前試合勝者/敗者」を表現し、`generateR32(groupRankings, thirds)` で `teamA/teamB` を解決、`pickWinner()` が `feedsTo` を辿って下流を更新。

```ts
type BracketSlot =
  | { kind:'winner'; group:GroupId } | { kind:'runnerUp'; group:GroupId }
  | { kind:'third'; candidates:GroupId[] }
  | { kind:'matchWinner'; matchId:number } | { kind:'matchLoser'; matchId:number };
// R16以降のfeed: 89..96(R16) ← R32勝者 / 97..100(QF) / 101-102(SF) / 103=L101vsL102(3位決定) / 104=W101vsW102(決勝)
```

- **3位8チームのR32枠割当**：公式は495シナリオ早見表だが、**採点は到達ラウンド方式で対戦カードの厳密配置に非依存**。よって**決定論的な簡易ルール**（third枠をmatchId昇順×通過3位をグループ辞書順で貪欲割当、解けなければ制約緩和して必ず8枠埋める）で実装。
- ⚠️ **実装時の必須検証**：R32の具体的な対戦カード（どの組1位がどの組2位/3位と当たるか）は **公式確定版（Wikipedia "2026 FIFA World Cup knockout stage" 等）でマッチ単位に再検証してから投入**。設計段階の対戦表は叩き台。

### 採点（到達ラウンド方式・M4）

各チームの「予想到達ラウンド」と「実到達ラウンド」を比較。**対戦カードの厳密さに依存せず、そのチームがどこまで勝ったかだけで採点**できるのが利点。

| 項目 | 配点(案) |
|---|---|
| GL各組 1位的中 | +3 |
| GL各組 2位的中 | +2 |
| GL組 並び完全一致 | +2 |
| 3位通過チーム的中 | +2/チーム |
| 各チーム到達ラウンド的中 | R32到達=1 … FINAL=5 |
| 優勝/準優勝/3位/4位的中 | +15/+8/+5/+3 |

`scorePrediction(payload, actual): ScoreBreakdown`。実結果 `ActualResult` は当面 `domain/data/actual.ts` に静的保持（手動更新）→将来 `results` テーブル化。

---

## 実装フェーズ

各Mで「動くもの」が出る粒度。**ローカル完結 → 共有 → 採点** の順。

- **M0 初期化（0.5日）**：C3でNext.js+OpenNextテンプレ生成。`wrangler.jsonc`に`nodejs_compat`＋`compatibility_date>=2024-09-23`＋`d1_databases(binding=DB)`。Tailwind導入、`src/`骨組み。→ `npm run dev`でトップ表示＆ダミーRoute Handlerで`env.DB`疎通確認。
- **M1 ローカルウィザード完結（最優先・2〜3日）**：確定データ投入（teams/groups）、`domain/bracket`一式、Zustand store、4ステップUI＋進捗バー、素朴版invalidate。→ **localStorageだけで予想を最初から最後まで完結＋途中復帰**（D1不要で動く）。
- **M2 共有（1〜1.5日）**：`db/schema.ts`＋drizzleマイグレーション→`wrangler d1 migrations apply`。`POST /api/predictions`（zod→nanoid→insert）。`/p/[id]` SSR表示。サマリに「共有」ボタン→URLコピー。→ **完成予想をURL限定共有・閲覧可**。
- **M3 仕上げ（1日）**：invalidateを最小カスケードに強化、テキストOGP、モバイルUX磨き込み。
- **M4 採点・ランキング（後フェーズ・2日）**：`actual.ts`＋`scoring/score.ts`、バッチ採点（保護Route Handler）、`/ranking`（score降順）。ランキング単位（ルーム制等）はここで詳細設計。

## 重要ファイル（実装の核・すべて新規）

- `src/domain/bracket/r32-template.ts` — 公式R32〜決勝の経路定数（**要・公式再検証**）
- `src/domain/bracket/generateR32.ts` / `advance.ts` — 対戦表生成＆勝者進行
- `src/domain/prediction/reducer.ts` — 状態遷移＋依存無効化（純関数・テスト容易）／ `src/state/predictionStore.ts` — `useSyncExternalStore`用の自前ストア＋localStorage同期
- `src/db/schema.ts` — Drizzle/D1スキーマ（JSON＋非正規化）
- `src/domain/prediction/serialize.ts` — store⇄D1ペイロード変換（採点の入口）

## 落とし穴と対処

1. **runtime**：全Route Handler/動的ページで `export const runtime = 'nodejs'`（Edge不使用）。`compatibility_flags=["nodejs_compat"]` 必須。
2. **I/Oコンテキスト**：`getCloudflareContext()`/`getDb()` は必ずリクエスト内で呼ぶ。`domain/`はenv非依存。
3. **Worker 3MiB制限**：画像同梱ゼロ（国旗=絵文字、`codeToEmoji`で生成）。重いUIライブラリ/日付ライブラリ不使用。M0で一度バンドルサイズ計測。
4. **国旗の特例**：イングランド/スコットランドは地域旗（絵文字が特殊）。`code`にISO2を保持し、特例は実装時に個別対応。
5. **localStorage×SSR**：`useSyncExternalStore` の `getServerSnapshot` がデフォルト状態を返し、クライアントマウント後にlocalStorageへ同期（ハイドレーション不整合を構造的に回避）。`/p/[id]`はlocalStorage不使用（純SSR）。
6. **JSON検証**：DBはJSON中身を検証しない→insert前に必ずzod。`schemaVersion`を持たせ将来移行に備える。

## プロジェクト初期化の注意（vault配下）

- カレント `/Users/tomoyukimatsuda/vault/projects/FIFA-W-CUP2026` に既存の設計md（`勝ち抜き予想アプリケーション開発設計.md`）があり、C3が競合検出する可能性。→ **M0で設計mdを `docs/` に移動して保持**してからC3を実行（gitでuntracked＝移動安全）。`.gitignore`に`.open-next/`・`.wrangler/`・`.dev.vars`を追加。

## 検証方法（エンドツーエンド）

- **M1**：`npm run dev` でウィザードを通しで操作（12組順位→3位8選択→R32〜決勝→サマリ）。ブラウザ再読込で下書き復帰を確認。前段（GL/3位）を後から変更して下流pickが正しく無効化されるか確認。
- **M2**：`npm run preview`（本番相当）で予想保存→返却`id`で`/p/{id}`閲覧。`wrangler d1 execute <db> --local --command="SELECT id,nickname,champion_team_id FROM predictions"` でレコード確認。
- **デプロイ**：`wrangler login` →（初回）`wrangler d1 create` →`wrangler d1 migrations apply <db> --remote` →`npm run deploy` →発行URLで動作確認。
- **データ正確性**：teams/groups の48チーム・12組、R32対戦表を公式ソースと突き合わせ（友人に出す前の必須チェック）。
