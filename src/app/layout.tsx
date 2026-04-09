import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "图像背景去除 - Image Background Remover",
  description: "简单、快速、免费的在线图像背景去除工具",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
