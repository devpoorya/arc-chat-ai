import { type ReactNode } from "react";

export default function ChatLayout({ children }: { children: ReactNode }) {
  return (
    <div className="dark flex h-screen overflow-hidden bg-neutral-800">
      <nav className="flex w-64 shrink-0 flex-col items-start border-r border-r-neutral-600 px-6 py-8">
        <h1 className="text-2xl font-black text-white">Arc Chat</h1>
      </nav>
      <main className="flex-grow">{children}</main>
    </div>
  );
}
