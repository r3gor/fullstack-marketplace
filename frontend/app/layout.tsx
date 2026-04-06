import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { cn } from "@/lib/utils";

const satoshi = localFont({
  src: "../public/fonts/Satoshi-Variable.woff2",
  variable: "--font-sans",
  weight: "300 900",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    template: "%s | FS ECommerce",
    default: "FS ECommerce",
  },
  description: "The best e-commerce platform for your online store.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={cn("font-sans", satoshi.variable)}>
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
