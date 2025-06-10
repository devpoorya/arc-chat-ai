import { Button } from "@/components/ui/button";
import { validateRequest } from "@/lib/server-utils";
import { LogInIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { type ReactNode } from "react";

export default async function ChatLayout({
  children,
}: {
  children: ReactNode;
}) {
  const { user } = await validateRequest();
  return (
    <div className="dark bg-background flex h-screen overflow-hidden">
      <nav className="m-4 flex w-72 shrink-0 flex-col items-start rounded-xl border border-neutral-600 bg-[#161B29] px-4 pt-6 pb-4">
        <h1 className="text-foreground text-xl font-bold">Arc Chat</h1>
        {user ? (
          <div className="mt-auto flex items-center gap-4">
            <div className="relative h-9 w-9 overflow-hidden rounded-full">
              <Image src={user.image!} alt="" fill className="object-cover" />
            </div>
            <div>
              <div className="text-sm font-semibold text-white">
                {user.name}
              </div>
              <div className="text-xs font-light text-white">{user.email}</div>
            </div>
          </div>
        ) : (
          <Button asChild className="mt-auto w-full" variant={"default"}>
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
