import { Button } from "@/components/ui/button";
import { validateRequest } from "@/lib/server-utils";
import { LogInIcon } from "lucide-react";
import Link from "next/link";
import { type ReactNode } from "react";

export default async function ChatLayout({
  children,
}: {
  children: ReactNode;
}) {
  const { user } = await validateRequest();
  return (
    <div className="dark flex h-screen overflow-hidden bg-neutral-800">
      <nav className="flex w-64 shrink-0 flex-col items-start border-r border-r-neutral-600 px-6 py-8">
        <h1 className="text-2xl font-black text-white">Arc Chat</h1>
        {user ? (
          <div>{user.name}</div>
        ) : (
          <Button asChild className="mt-auto w-full">
            <Link href={"/auth/login"}>
              <LogInIcon />
              Login
            </Link>
          </Button>
        )}
      </nav>
      <main className="flex-grow">{children}</main>
    </div>
  );
}
