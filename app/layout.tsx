import type { Metadata } from "next";
import { Cairo } from "next/font/google";
import "./globals.css";
import { SettingsProvider } from "../lib/SettingsProvider";

const cairo = Cairo({
  subsets: ["arabic", "latin"],
  variable: "--font-cairo",
});

export const metadata: Metadata = {
  title: "هاتلي | اشترِ من شي إن عبر وسطاء موثقين",
  description: "قارن أسعار الوسطاء في مصر واختر الأنسب لك بوضوح وأمان.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ar" dir="rtl" className={cairo.variable}>
      <body>
        <SettingsProvider>{children}</SettingsProvider>
      </body>
    </html>
  );
}