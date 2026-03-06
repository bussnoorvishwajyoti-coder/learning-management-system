import type { Metadata } from "next";
import Script from "next/script";
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
        {/* Inject Hugging Face API Key for Chatbot */}
        <Script id="hf-config" strategy="beforeInteractive">
          {`window.HF_API_KEY = "${process.env.NEXT_PUBLIC_HF_API_KEY || ''}";`}
        </Script>
        {/* AI Chatbot Widget */}
        <Script src="/chatbot-widget.js" strategy="lazyOnload" />
      </body>
    </html>
  );
}
