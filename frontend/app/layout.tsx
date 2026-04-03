import type { Metadata } from "next";
import { Geist, Geist_Mono, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { MainLayout } from "@/components/templates/MainLayout";
import { cn } from "@/lib/utils";

const spaceGrotesk = Space_Grotesk({subsets:['latin'],variable:'--font-sans'});


// const geistSans = Geist({
//   variable: "--font-geist-sans",
//   subsets: ["latin"],
// });
//
// const geistMono = Geist_Mono({
//   variable: "--font-geist-mono",
//   subsets: ["latin"],
// });

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
    <html lang="es" className={cn("font-sans", spaceGrotesk.variable)}>
      <body className="flex min-h-full flex-col">
        <MainLayout>{children}</MainLayout>
      </body>
    </html>
  );
}
