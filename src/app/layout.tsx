import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "けあしる | 介護の「見えない時間」可視化 × 保険外サービス横断検索",
  description: "高齢の親族を介護する家族の介護時間を28スロットのタイムラインで可視化。公的保険給付・自治体上乗せ・民間自費サービスを最適に組み合わせ、「いくらで何時間が買い戻せるか」を即座に提示します。",
  keywords: [
    "介護",
    "けあしる",
    "保険外サービス",
    "要介護度",
    "ケアプラン",
    "自費サービス",
    "ヤングケアラー",
    "介護離職防止",
    "自治体DX",
  ],
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#FFF7F2",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" className="h-full antialiased" suppressHydrationWarning>
      <head />
      {/* オレンジのブランド体験を保つため、公開画面はライトテーマに統一 */}
      <body className="min-h-full flex flex-col">
        {children}
      </body>
    </html>
  );
}
