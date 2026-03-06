import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Trend Intelligence Dashboard",
  description:
    "Real-time keyword trend analysis powered by Google Trends, GDELT, and YouTube — no paid APIs required.",
  keywords: ["trends", "analytics", "google trends", "dashboard", "intelligence"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="bloomberg">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body className="min-h-screen font-[var(--font-sans)] antialiased">
        {children}
      </body>
    </html>
  );
}
