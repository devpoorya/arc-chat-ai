import { validateRequest } from "@/lib/server-utils";
import { type ReactNode } from "react";
import ChatSidebar from "./chat-sidebar";
import { db } from "@/db";
import { eq } from "drizzle-orm";
import { threads } from "@/db/schema/content.sql";

export default async function ChatLayout({
  children,
}: {
  children: ReactNode;
}) {
  const { user } = await validateRequest();
  const threadsList = user?.id
    ? await db.query.threads.findMany({
        where: eq(threads.threadOwnerId, user.id),
      })
    : [];
  return (
    <div className="background-gradient relative h-screen overflow-hidden">
      <ChatSidebar user={user ?? undefined} threadsList={threadsList} />
      {children}
    </div>
  );
}
