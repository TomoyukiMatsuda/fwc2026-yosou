// 完成までフル操作する E2E スモークテスト（puppeteer-core + システムChrome）。
// 前提: `npm run dev` が http://localhost:3000 で起動済み。
import puppeteer from "puppeteer-core";

const CHROME =
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const BASE = "http://localhost:3000";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function assert(cond, msg) {
  if (!cond) throw new Error("ASSERT FAILED: " + msg);
}

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: "new",
  args: ["--no-sandbox"],
});
const page = await browser.newPage();
await page.setViewport({ width: 390, height: 844 }); // iPhone相当

const pageErrors = [];
const http404 = [];
page.on("pageerror", (e) => pageErrors.push(String(e)));
page.on("console", (m) => {
  if (m.type() === "error" && !/status of 404/.test(m.text())) {
    pageErrors.push("console.error: " + m.text());
  }
});
page.on("response", (res) => {
  if (res.status() === 404) http404.push(res.url());
});

try {
  // クリーンスタート
  await page.goto(BASE + "/predict", { waitUntil: "networkidle0" });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: "networkidle0" });

  // ---- STEP1: 12グループの順位付け ----
  let groupsRanked = 0;
  for (let i = 0; i < 14; i++) {
    // THIRDステップに着いたら抜ける
    const onThird = await page.$('[data-testid="third-card"]');
    if (onThird) break;
    // 現在グループの4チームを順にタップ
    for (let k = 0; k < 4; k++) {
      await page.waitForSelector('[data-testid="gp-pick"]', { timeout: 5000 });
      await page.click('[data-testid="gp-pick"]');
      await sleep(70);
    }
    // 「次へ」が有効になるのを待ってクリック
    await page.waitForFunction(
      () => {
        const b = document.querySelector('[data-testid="step-next"]');
        return b && !b.disabled;
      },
      { timeout: 5000 },
    );
    await page.click('[data-testid="step-next"]');
    groupsRanked++;
    await sleep(120);
  }
  assert(groupsRanked === 12, `12グループ完了のはず (実際 ${groupsRanked})`);

  // ---- STEP2: 3位通過8チーム選択 ----
  await page.waitForSelector('[data-testid="third-card"]', { timeout: 5000 });
  const thirdCards = await page.$$('[data-testid="third-card"]');
  assert(thirdCards.length === 12, `3位候補12のはず (実際 ${thirdCards.length})`);
  for (let i = 0; i < 8; i++) {
    await thirdCards[i].click();
    await sleep(50);
  }
  await page.waitForFunction(
    () => {
      const b = document.querySelector('[data-testid="step-next"]');
      return b && !b.disabled;
    },
    { timeout: 5000 },
  );
  await page.click('[data-testid="step-next"]');
  await sleep(150);

  // ---- STEP3: ノックアウト全試合の勝者選択 ----
  // 固定フッターの下にあるカードは物理クリックが当たらないため、
  // ページ内 element.click() で onClick を直接発火させる（座標非依存）。
  await page.waitForSelector('[data-testid="match"]', { timeout: 5000 });
  let steps = 0;
  while (steps < 200) {
    const clickedMid = await page.evaluate(() => {
      const b = document.querySelector('[data-testid="step-next"]');
      if (b && !b.disabled) return "DONE";
      const el = document.querySelector(
        '[data-testid="match"][data-ready="true"][data-decided="false"] [data-side="A"]',
      );
      if (!el) return null;
      const mid = el
        .closest('[data-testid="match"]')
        ?.getAttribute("data-mid");
      el.click();
      return mid ?? "?";
    });
    if (clickedMid === "DONE" || clickedMid === null) break;
    steps++;
    await sleep(40);
  }
  const decidedCount = await page.$$eval(
    '[data-testid="match"][data-decided="true"]',
    (els) => els.length,
  );
  if (decidedCount !== 32) {
    const undecided = await page.$$eval(
      '[data-testid="match"]:not([data-decided="true"])',
      (els) =>
        els.map((e) => ({
          mid: e.getAttribute("data-mid"),
          ready: e.getAttribute("data-ready"),
        })),
    );
    throw new Error(
      `32試合決着のはず (実際 ${decidedCount}) 未決着=${JSON.stringify(undecided)}`,
    );
  }

  await page.click('[data-testid="step-next"]');
  await sleep(150);

  // ---- STEP4: サマリーで優勝チーム確認 ----
  await page.waitForSelector('[data-testid="champion"]', { timeout: 5000 });
  const champion = await page.$eval(
    '[data-testid="champion"]',
    (el) => el.textContent?.trim() ?? "",
  );
  assert(champion.length > 0, "優勝チームが表示されているはず");

  // ---- 下書き復帰: リロードしてサマリー＆優勝が保持されるか ----
  await page.reload({ waitUntil: "networkidle0" });
  await page.waitForSelector('[data-testid="champion"]', { timeout: 5000 });
  const championAfter = await page.$eval(
    '[data-testid="champion"]',
    (el) => el.textContent?.trim() ?? "",
  );
  assert(
    championAfter === champion,
    `復帰後も同じ優勝 (前 ${champion} / 後 ${championAfter})`,
  );

  // ---- 共有: ShareSection → POST /api/predictions → /p/[id] SSR ----
  await page.waitForSelector('[data-testid="share-nickname"]', { timeout: 5000 });
  await page.evaluate(() =>
    document
      .querySelector('[data-testid="share-nickname"]')
      .scrollIntoView({ block: "center" }),
  );
  await page.click('[data-testid="share-nickname"]');
  await page.type('[data-testid="share-nickname"]', "テスト太郎");
  await page.evaluate(() =>
    document.querySelector('[data-testid="share-submit"]').click(),
  );
  await page.waitForSelector('[data-testid="share-url"]', { timeout: 10000 });
  const shareUrl = await page.$eval('[data-testid="share-url"]', (el) =>
    el.getAttribute("href"),
  );
  assert(
    shareUrl && /\/p\/[0-9A-Za-z]{10}$/.test(shareUrl),
    `共有URLが /p/{10文字id} 形式 (実際 ${shareUrl})`,
  );

  // 共有ページを開いて優勝チーム＆ニックネームを確認（純SSR）
  await page.goto(shareUrl, { waitUntil: "networkidle0" });
  await page.waitForSelector('[data-testid="champion"]', { timeout: 5000 });
  const sharedChampion = await page.$eval(
    '[data-testid="champion"]',
    (el) => el.textContent?.trim() ?? "",
  );
  assert(
    sharedChampion === champion,
    `共有ページの優勝が一致 (元 ${champion} / 共有 ${sharedChampion})`,
  );
  const hasNickname = await page.evaluate(() =>
    document.body.textContent.includes("テスト太郎"),
  );
  assert(hasNickname, "共有ページにニックネームが表示される");

  // ---- 無効化: 前段(GL)変更で下流がカスケード無効化される ----
  // 復帰直後は SUMMARY（完成）。優勝が実チームで出ていることを確認。
  await page.goto(BASE + "/predict", { waitUntil: "networkidle0" });
  await page.waitForSelector('[data-testid="champion"]', { timeout: 5000 });
  const champBefore = await page.$eval(
    '[data-testid="champion"]',
    (el) => el.textContent?.trim() ?? "",
  );
  const summaryBefore = champBefore.length > 0 && !champBefore.includes("未定");
  assert(summaryBefore, `変更前: 完成予想が復帰しているはず (${champBefore})`);

  // グループステップ → A組 → やり直す（A組順位を解除＝前段変更）
  await page.evaluate(() =>
    document.querySelector('[data-testid="nav-GROUP"]').click(),
  );
  await page.waitForSelector('[data-testid="gp-pill"][data-group="A"]', {
    timeout: 5000,
  });
  await page.evaluate(() =>
    document.querySelector('[data-testid="gp-pill"][data-group="A"]').click(),
  );
  await sleep(150);
  await page.evaluate(() => {
    const b = [...document.querySelectorAll("button")].find(
      (x) => x.textContent.trim() === "やり直す",
    );
    if (b) b.click();
  });
  await sleep(180);
  const summaryAfter = await page.evaluate(() => {
    const b = document.querySelector('[data-testid="nav-SUMMARY"]');
    return Boolean(b && !b.disabled);
  });
  assert(
    !summaryAfter,
    "変更後: 下流が無効化されサマリー到達不可になるはず",
  );

  assert(
    pageErrors.length === 0,
    "ページエラーなし、実際:\n" + pageErrors.join("\n"),
  );

  console.log(
    JSON.stringify(
      {
        ok: true,
        groupsRanked,
        thirdCandidates: thirdCards.length,
        knockoutDecided: decidedCount,
        champion,
        restoredChampion: championAfter,
        shareUrl,
        sharedChampion,
        invalidation: { summaryBefore, summaryAfter },
        pageErrors: pageErrors.length,
        http404: [...new Set(http404)],
      },
      null,
      2,
    ),
  );
} catch (e) {
  console.log(
    JSON.stringify(
      { ok: false, error: String(e), pageErrors },
      null,
      2,
    ),
  );
  process.exitCode = 1;
} finally {
  await browser.close();
}
