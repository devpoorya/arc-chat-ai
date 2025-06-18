import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { threads } from "@/db/schema/content.sql";
import { eq, and } from "drizzle-orm";
import { validateRequest } from "@/lib/server-utils";

export async function POST(req: NextRequest) {
  try {
    const { threadId, shareId } = await req.json();
    if (!threadId || !shareId) {
      return NextResponse.json({ error: "Missing threadId or shareId" }, { status: 400 });
    }

    const { user } = await validateRequest();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only allow the thread owner to update
    const [updatedThread] = await db
      .update(threads)
      .set({ shareId })
      .where(and(eq(threads.id, threadId), eq(threads.threadOwnerId, user.id)))
      .returning();

    if (!updatedThread) {
      return NextResponse.json({ error: "Thread not found or unauthorized" }, { status: 404 });
    }

    return NextResponse.json({ success: true, thread: updatedThread });
  } catch (error) {
    console.error('Error updating thread share_id:', error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
} 