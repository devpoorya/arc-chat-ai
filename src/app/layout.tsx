import "@/styles/globals.css";
import { Poppins } from "next/font/google";
import { type Metadata } from "next";
import { Toaster } from "@/components/ui/sonner";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
  variable: "--font-poppins",
});

export const metadata: Metadata = {
  title: "Arc Chat",
  description: "Faster More Affordable Chat",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={poppins.className}>
      <body>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
