import ChatLayout from "./_components/chat-layout";
import ChatBox from "./_components/chat-box";
import ChatMessages from "./_components/chat-messages";

export default function ChatPage() {
  return (
    <ChatLayout>
      <ChatMessages />
      <ChatBox />
    </ChatLayout>
  );
}
