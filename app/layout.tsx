import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ShokoShop – T-Shirts & Wall Art",
  description:
    "Premium T-shirts and wall art exclusive designs delivered to your door.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-gray-50 dark:bg-gray-950">
        {children}
      </body>
    </html>
  );
}
