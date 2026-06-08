# 2026 FIFA W杯 勝ち抜き予想アプリ

2026 FIFAワールドカップ（史上初の48チーム制）の勝ち抜きを、グループリーグ〜トーナメント〜ベスト4まで「順々に答えるだけ」で予想できるモバイルファーストのWebアプリ。ログイン不要・途中保存OK・完成予想はURLで限定共有できる。完成した予想はこの端末のローカル履歴に残り、トップページからいつでも見返せる。

## 技術構成

- **Next.js 16 (App Router) + TypeScript + Tailwind CSS v4**
- **`@opennextjs/cloudflare`（OpenNext）→ Cloudflare Workers** にデプロイ
- **D1 (SQLite) + Drizzle ORM**（予想本体はJSON 1カラム + 非正規化カラム）
- **状態管理: `useSyncExternalStore`（React公式API）+ 自前の軽量ストア**（状態管理ライブラリ不使用）
- 追加依存は **nanoid**（共有ID）と **zod**（payload検証）の最小限のみ
- バンドル: gzip 約1.1 MiB（Workers無料枠3 MiB制限に対し十分小さい）

## ディレクトリ構成

```
src/
├── app/                  # ルート（/ ランディング+履歴一覧, /predict ウィザード, /p/[id] 共有閲覧, /history/[id] ローカル履歴閲覧, /api/*）
├── components/           # ui原子, wizard各ステップ, bracket表示, TeamBadge, ShareSection
├── domain/               # 環境非依存の純TS（テスト容易・Worker軽量）
│   ├── data/             # teams.ts / groups.ts（確定データ同梱）
│   ├── bracket/          # r32-template / generateR32 / advance / thirdPlace
│   └── prediction/       # types / reducer / selectors / schema(zod) / serialize
├── state/                # predictionStore（自前ストア+localStorage）/ usePrediction
├── db/                   # schema.ts(Drizzle) / client.ts(getDb)
└── lib/                  # id(nanoid) / flag(国旗絵文字) / cn
```

「真実」は3つ（GL順位 / 3位通過 / ノックアウト勝者）だけ保持し、対戦表・ベスト4などの派生は都度計算する。前段を変えると矛盾する下流pickだけ自動削除（カスケード無効化）。

## ローカル開発

```bash
npm install
npm run dev            # http://localhost:3000
```

`next dev` でも OpenNext 経由で `env.DB`（ローカルD1）が使える（`initOpenNextCloudflareForDev`）。

### データベース（ローカル）

```bash
npm run db:generate           # schema.ts からマイグレーションSQLを ./drizzle に生成
npm run db:migrate:local      # ローカルD1へ適用（.wrangler/state）
```

ローカルD1の中身確認:

```bash
npx wrangler d1 execute fifa-wcup2026-db --local \
  --command="SELECT id, nickname, champion_team_id FROM predictions"
```

## テスト

```bash
npx tsc --noEmit              # 型チェック
node tests/e2e-smoke.mjs      # フル通し操作のE2E（要 dev起動 + システムChrome）
```

E2Eは puppeteer-core + システムChrome で、12組順位→3位8選択→ノックアウト全試合→サマリ→下書き復帰→共有→無効化までを検証する。

## 本番ビルド / プレビュー（workerd）

```bash
npx opennextjs-cloudflare build   # 本番ビルド → .open-next/worker.js
npx wrangler dev                  # 本番workerをローカルworkerdで起動（http://localhost:8787）
npx wrangler deploy --dry-run     # アップロードサイズ確認（gzip < 3 MiB を確認）
```

## Cloudflareへデプロイ

初回のみ:

```bash
npx wrangler login
npx wrangler d1 create fifa-wcup2026-db
# 出力された database_id を wrangler.jsonc の "database_id" に貼り付ける
npx wrangler d1 migrations apply fifa-wcup2026-db --remote
```

OGP・メタデータの絶対URL解決には `NEXT_PUBLIC_SITE_URL` を使う。`NEXT_PUBLIC_` 接頭辞付き＝**ビルド時にインライン化**されるため、ランタイム変数（wrangler.jsonc の `vars` やダッシュボード）では反映されない点に注意。本番は GitHub Actions（`.github/workflows/deploy.yml`）のビルドステップで `https://fifa-wcup2026.tm29.workers.dev` を設定済み。ローカルで変えたい場合は `.env.local` に `NEXT_PUBLIC_SITE_URL=...` を置く（未設定時は `http://localhost:3000`）。

デプロイ / 更新:

```bash
npm run deploy        # opennextjs-cloudflare build && deploy
```

スキーマ変更時は `npm run db:generate` → `wrangler d1 migrations apply fifa-wcup2026-db --remote` を忘れずに。

## データ正確性

- グループ・48チーム・R32〜決勝のブラケット経路は、Wikipedia "2026 FIFA World Cup (draw / knockout stage)" を中心に複数ソース（DAZN / MLSSoccer 等）で2026-06-07時点で照合済み（`src/domain/data/teams.ts` と `src/domain/bracket/r32-template.ts` のコメント参照）。
- 大会直前に変更があれば該当ファイルを更新するだけでよい（データは単一ソース化されている）。

## 今後（M4: 採点・ランキング）

DBは拡張しやすい形（`score` / `scored_at` カラム + `champion_team_id` 非正規化 + `idx_pred_score`）。到達ラウンド方式の採点（`domain/scoring`）、実結果データ、`/ranking`、ランキング単位（ルーム制等）は後フェーズで実装予定。
