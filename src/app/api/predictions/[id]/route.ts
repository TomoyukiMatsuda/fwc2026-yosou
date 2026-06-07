import { eq } from "drizzle-orm";
import { getDb } from "@/db/client";
import { predictions } from "@/db/schema";

export const runtime = "nodejs";

/** GET /api/predictions/[id] : 1件取得（保険。閲覧はSSRが主） */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  try {
    const db = getDb();
    const row = await db
      .select({
        id: predictions.id,
        nickname: predictions.nickname,
        payload: predictions.payload,
        championTeamId: predictions.championTeamId,
        createdAt: predictions.createdAt,
      })
      .from(predictions)
      .where(eq(predictions.id, id))
      .get();

    if (!row) {
      return Response.json({ error: "見つかりません" }, { status: 404 });
    }
    return Response.json(row);
  } catch (e) {
    return Response.json(
      { error: "取得に失敗しました", detail: e instanceof Error ? e.message : String(e) },
      { status: 500 },
    );
  }
}
