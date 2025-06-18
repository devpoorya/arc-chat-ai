import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { threads } from "@/db/schema/content.sql";
import { eq, and } from "drizzle-orm";
import { validateRequest } from "@/lib/server-utils";

export async function POST(req: NextRequest) {
  const { threadId, shareId } = await req.json();
  if (!threadId || !shareId) {
    return NextResponse.json({ error: "Missing threadId or shareId" }, { status: 400 });
  }
  const { user } = await validateRequest();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  // Only allow the thread owner to update
  const updated = await db
    .update(threads)
    .set({ shareId })
    .where(and(eq(threads.id, threadId), eq(threads.threadOwnerId, user.id)));
  return NextResponse.json({ success: true });
} 