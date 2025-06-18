import { db, queryBuilder } from "@/db";
import { threads, messages } from "@/db/schema/content.sql";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

export default async function PublicChatPage({ params }: { params: { share_id: string } }) {
  console.log('Share page params:', params);
  
  try {
    console.log('Attempting to fetch thread with share_id:', params.share_id);
    
    // First try direct database query
    const directThread = await db.select().from(threads).where(eq(threads.shareId, params.share_id)).limit(1);
    console.log('Direct query result:', directThread);
    
    // Then try query builder
    const thread = await queryBuilder.threads.findFirst(eq(threads.shareId, params.share_id));
    console.log('Query builder result:', thread);
    
    if (!thread) {
      console.log('Thread not found, returning 404');
      return notFound();
    }

    console.log('Fetching messages for thread:', thread.id);
    const msgs = await queryBuilder.messages.findMany(eq(messages.threadId, thread.id));
    console.log('Found messages:', msgs.length);

    const renderMessageContent = (content: string) => {
      if (!content) return null;
      
      const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
      const parts = [];
      let lastIndex = 0;
      let match;
      
      while ((match = codeBlockRegex.exec(content)) !== null) {
        if (match.index > lastIndex) {
          parts.push(
            <div key={`text-${lastIndex}`} className="text-sm leading-relaxed" style={{ color: "black" }}>
              {content.slice(lastIndex, match.index)}
            </div>
          );
        }
        const language = match[1] || 'text';
        const code = match[2]?.trim() || '';
        parts.push(
          <div key={`code-${match.index}`} className="my-2">
            <SyntaxHighlighter 
              language={language} 
              style={vscDarkPlus} 
              customStyle={{ margin: 0, borderRadius: '0.375rem', fontSize: '0.875rem' }}
            >
              {code}
            </SyntaxHighlighter>
          </div>
        );
        lastIndex = match.index + match[0].length;
      }
      
      if (lastIndex < content.length) {
        parts.push(
          <div key={`text-${lastIndex}`} className="text-sm leading-relaxed" style={{ color: "black" }}>
            {content.slice(lastIndex)}
          </div>
        );
      }
      
      return parts;
    };

    return (
      <div className="min-h-screen" style={{ backgroundColor: 'rgb(195,198,233)' }}>
        <div className="max-w-4xl mx-auto py-8 px-4">
          <h1 className="text-2xl font-bold mb-6" style={{ color: 'black' }}>
            {thread.title} (Shared)
          </h1>
          <div className="flex flex-col gap-4">
            {msgs.map((m, i) => (
              <div 
                key={i} 
                className={`flex w-full items-center gap-2 rounded-md border p-4 ${
                  m.senderRole === 'user' ? 'bg-white' : 'bg-gray-50'
                }`}
              >
                <div className="flex-grow">
                  {renderMessageContent(m.textContent ?? "")}
                </div>
              </div>
            ))}
            {msgs.length === 0 && (
              <div className="text-center text-gray-500">
                No messages in this chat.
              </div>
            )}
          </div>
        </div>
      </div>
    );
  } catch (error) {
    console.error('Error in share page:', error);
    throw error;
  }
} 