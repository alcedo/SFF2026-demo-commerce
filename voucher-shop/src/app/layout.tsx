import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Red_Hat_Display, Red_Hat_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";

const display = Red_Hat_Display({
  variable: "--font-display",
  subsets: ["latin"],
});

const redHatMono = Red_Hat_Mono({
  variable: "--font-redhat-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AgentiX Playground · Digital Vouchers",
  description:
    "Where agents learn to pay. Buy digital vouchers with USDC on live stablecoin rails.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="en"
      className={`${display.variable} ${redHatMono.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-ink text-paper">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
