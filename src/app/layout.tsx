import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";

const geist = Geist({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "ここにいるワン",
  description: "仲の良いフレンドと一緒にドッグランへ",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body className={`${geist.className} bg-amber-50 min-h-screen`}>
        <Header />
        <main className="max-w-lg mx-auto px-4 pb-20">{children}</main>
      </body>
    </html>
  );
}
