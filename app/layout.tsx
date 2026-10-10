import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "WedGo - বিয়ের জন্য সেরা ম্যাট্রিমনি",
  description: "সারা বিশ্বে একমাত্র ম্যাট্রিমনি যেখানে অডিও কল, ভিডিও কলে কথা বলে জেনে বুঝে তারপর বিয়ে করা যায়",
  manifest: "/manifest.json",
  themeColor: "#e91e63",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="bn">
      <head>
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <link rel="apple-touch-icon" href="/logo.png" />
      </head>
      <body>
        {children}
        <script dangerouslySetInnerHTML={{ __html: `if('serviceWorker' in navigator){navigator.serviceWorker.register('/sw.js');}` }} />
      </body>
    </html>
  );
}
