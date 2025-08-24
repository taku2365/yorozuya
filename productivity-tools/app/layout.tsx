import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { MainLayout } from "@/components/layout/main-layout";
import { DatabaseProvider } from "@/components/providers/database-provider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "生産性ツール集",
  description: "ToDo管理、WBS、カンバン、ガントチャートを統合した生産性向上ツール",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className={inter.className}>
        <DatabaseProvider>
          <MainLayout>{children}</MainLayout>
        </DatabaseProvider>
      </body>
    </html>
  );
}
