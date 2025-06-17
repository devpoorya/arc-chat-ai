import ChatLayout from "./_components/chat-layout";
import ChatBox from "./_components/chat-box";
import ChatMessages from "./_components/chat-messages";
import { validateRequest } from "@/lib/server-utils";

export default async function ChatPage() {
  const { session } = await validateRequest();
  return (
    <ChatLayout>
      <ChatMessages isLoggedIn={!!session} />
      {!!session && <ChatBox />}
    </ChatLayout>
  );
}
