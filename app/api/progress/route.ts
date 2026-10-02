import { getLearningUser } from "../../student-auth";
import { database } from "../../../db";
import { topics } from "../../data";
export const dynamic = "force-dynamic";
export async function GET() {
  let user;
  try { user = await getLearningUser(true); } catch { return Response.json({error:"帳戶服務暫時未能連接，請稍後重試。"},{status:503}); }
  if (!user) return Response.json({ error: "請登入後保存進度。" }, { status: 401 });
  try {
    const rows = await database().prepare("SELECT topic_id, status FROM progress WHERE user_id = ?").bind(user.userId).all<{topic_id:string,status:number}>();
    return Response.json({ progress: Object.fromEntries(rows.results.map(r => [r.topic_id, r.status])) }, { headers: {"Cache-Control":"no-store"} });
  } catch (error) {
    console.error("Progress load failed", error);
    return Response.json({ error: "暫時未能讀取進度，請重試。" }, { status: 503 });
  }
}
export async function PUT(request: Request) {
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin) return Response.json({ error:"Invalid origin" }, {status:403});
  let user;
  try { user = await getLearningUser(true); } catch { return Response.json({error:"帳戶服務暫時未能連接，請稍後重試。"},{status:503}); }
  if (!user) return Response.json({ error: "請登入後保存進度。" }, { status: 401 });
  let input: { topicId?: unknown; status?: unknown };
  try { input = await request.json(); } catch { return Response.json({error:"Invalid input"},{status:400}); }
  if (typeof input.topicId !== "string" || !topics.some(t => t.id === input.topicId) || typeof input.status !== "number" || ![0,1,2].includes(input.status)) return Response.json({ error: "Invalid progress" }, { status: 400 });
  try {
    await database().prepare("INSERT INTO progress (user_id, topic_id, status, updated_at) VALUES (?, ?, ?, ?) ON CONFLICT(user_id, topic_id) DO UPDATE SET status = excluded.status, updated_at = excluded.updated_at").bind(user.userId,input.topicId,input.status,new Date().toISOString()).run();
    return Response.json({ ok: true });
  } catch(error) {
    console.error("Progress save failed",error);
    return Response.json({ error: "未能保存此更改，請再按一次重試。" }, { status: 503 });
  }
}
