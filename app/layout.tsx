import type { Metadata } from "next";
import { Instrument_Sans, Geist_Mono } from "next/font/google";
import { Toaster } from "react-hot-toast";
import "./globals.css";

const instrumentSans = Instrument_Sans({
  variable: "--font-instrument-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Vision Caption Studio",
  description: "AI image captioning and tagging workspace",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="zh-TW"
      className={`${instrumentSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="h-full">
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: "#FAF8F5",
              color: "#1C1917",
              border: "1px solid rgba(0,0,0,0.07)",
              borderRadius: "12px",
              boxShadow:
                "0 8px 32px rgba(28,25,23,0.12), 0 2px 8px rgba(28,25,23,0.06)",
              fontSize: "14px",
              fontFamily:
                "var(--font-instrument-sans), 'DM Sans', sans-serif",
              padding: "12px 16px",
            },
            success: {
              iconTheme: { primary: "#3D7A5E", secondary: "#FAF8F5" },
            },
            error: {
              iconTheme: { primary: "#B45050", secondary: "#FAF8F5" },
            },
          }}
        />
      </body>
    </html>
  );
}
