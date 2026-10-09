import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "WedGo - বিয়ের জন্য সেরা ম্যাট্রিমনি",
  description: "সারা বিশ্বে একমাত্র ম্যাট্রিমনি যেখানে অডিও কল, ভিডিও কলে কথা বলে জেনে বুঝে তারপর বিয়ে করা যায়",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="bn">
      <body>{children}</body>
    </html>
  );
}
