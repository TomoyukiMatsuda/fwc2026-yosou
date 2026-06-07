import { z } from "zod";
import { getDb } from "@/db/client";
import { predictions } from "@/db/schema";
import { validateSharedPayload } from "@/domain/prediction/schema";
import { getChampionFromPayload } from "@/domain/prediction/serialize";
import { newShareId } from "@/lib/id";

// Edge ランタイムは OpenNext 非対応。nodejs を明示。
export const runtime = "nodejs";

const bodySchema = z.object({
  nickname: z.string().max(40).nullish(),
  payload: z.unknown(),
});

/** POST /api/predictions : 予想を保存して共有ID を返す */
export async function POST(request: Request) {
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return Response.json({ error: "JSONが不正です" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return Response.json({ error: "リクエスト形式が不正です" }, { status: 400 });
  }

  // 予想ペイロードを厳密検証（構造 + 完成した整合ブラケット）
  const result = validateSharedPayload(parsed.data.payload);
  if (!result.ok) {
    return Response.json({ error: result.error }, { status: 400 });
  }

  const nickname = parsed.data.nickname?.trim() || null;
  const championTeamId = getChampionFromPayload(result.payload);
  if (!championTeamId) {
    return Response.json({ error: "優勝チームを特定できません" }, { status: 400 });
  }

  const id = newShareId();
  try {
    const db = getDb();
    await db.insert(predictions).values({
      id,
      nickname,
      payload: result.payload,
      championTeamId,
    });
  } catch (e) {
    return Response.json(
      { error: "保存に失敗しました", detail: e instanceof Error ? e.message : String(e) },
      { status: 500 },
    );
  }

  return Response.json({ id }, { status: 201 });
}
