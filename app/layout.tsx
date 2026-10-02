import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "DSE Maths Roadmap｜穩步達標",
  description: "HKDSE 數學必修部分 Level 2 / 3 課題路線圖、個人進度、歷屆試卷分析與得分規劃。",
  other: {
    "codex-preview": "development",
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-Hant">
      <body className="antialiased">{children}</body>
    </html>
  );
}
