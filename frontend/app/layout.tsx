import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "LMS - Learning Management System",
  description: "A production-grade Learning Management System",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
