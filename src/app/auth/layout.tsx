import { GalleryVerticalEnd } from "lucide-react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="grid min-h-svh">
      <div className="flex flex-col gap-4 p-6 md:p-10">
        <div className="flex justify-center gap-2 md:justify-start">
          <a href="#" className="flex items-center gap-2 font-medium">
            <div className="bg-primary text-primary-foreground flex h-6 w-6 items-center justify-center rounded-md">
              <GalleryVerticalEnd className="size-4" />
            </div>
            Arc Chat
          </a>
        </div>
        <div className="flex flex-1 items-center justify-center">
          <div className="mx-auto">{children}</div>
        </div>
      </div>
    </div>
  );
}
