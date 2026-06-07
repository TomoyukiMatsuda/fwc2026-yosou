import type { Metadata, Viewport } from "next";
import "./globals.css";

// 本番URLは環境変数で上書き（未設定時はlocalhost）。OGPの絶対URL解決に使う。
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
const SITE_NAME = "2026 W杯 勝ち抜き予想";
const SITE_DESC =
  "2026 FIFAワールドカップ（史上初の48チーム制）の勝ち抜きを予想して、友だちとURLで共有しよう。";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: SITE_NAME,
  description: SITE_DESC,
  applicationName: SITE_NAME,
  openGraph: {
    title: SITE_NAME,
    description: SITE_DESC,
    siteName: SITE_NAME,
    locale: "ja_JP",
    type: "website",
  },
  twitter: { card: "summary", title: SITE_NAME, description: SITE_DESC },
};

export const viewport: Viewport = {
  themeColor: "#5b3df5",
  width: "device-width",
  initialScale: 1,
  // ウィザードの誤拡大を防ぎつつ、ピンチズーム自体は許可
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
