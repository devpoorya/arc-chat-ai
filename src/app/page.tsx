import ChatLayout from "./_components/chat-layout";
import ChatBox from "./_components/chat-box";
import ChatMessages from "./_components/chat-messages";

export default function ChatPage() {
  return (
    <ChatLayout>
      <div className="flex h-screen flex-col px-6 pt-8">
        <ChatMessages />
        <ChatBox />
      </div>
    </ChatLayout>
  );
}
