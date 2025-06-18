import { db, queryBuilder } from "@/db";
import { threads } from "@/db/schema/content.sql";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const shareId = searchParams.get('share_id');

  if (!shareId) {
    return NextResponse.json({ error: 'Share ID is required' }, { status: 400 });
  }

  try {
    const thread = await queryBuilder.threads.findFirst(eq(threads.shareId, shareId));
    return NextResponse.json({ exists: !!thread, thread });
  } catch (error) {
    console.error('Error checking share ID:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 