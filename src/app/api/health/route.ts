export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const [{ db }, { sql }] = await Promise.all([import("@/db"), import("drizzle-orm")]);
    await db.execute(sql`select 1`);
    return Response.json({ ok: true });
  } catch {
    return Response.json({ ok: false }, { status: 500 });
  }
}
