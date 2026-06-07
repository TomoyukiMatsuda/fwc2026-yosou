import { getCloudflareContext } from "@opennextjs/cloudflare";

// Edge ランタイムは OpenNext 非対応。全 Route Handler で nodejs を明示する。
export const runtime = "nodejs";

// M0 疎通確認用: env.DB バインディングが見えているかを返すだけのダミー。
export async function GET() {
  try {
    const { env } = getCloudflareContext();
    return Response.json({
      ok: true,
      dbBound: Boolean(env?.DB),
    });
  } catch (e) {
    return Response.json(
      { ok: false, error: e instanceof Error ? e.message : String(e) },
      { status: 500 },
    );
  }
}
