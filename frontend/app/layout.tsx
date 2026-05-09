
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Header } from "./src/components/lending/header";
import MerkleLoader from "./src/components/shared/intro";
import { BackgroundGlow } from "./src/components/shared/background-glow";
import { Providers } from "./providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "PANORAMA",
  description: "Map every dependency. Score every risk.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable}  antialiased overflow-hidden h-screen`}
    >
      <body className="min-h-full relative flex flex-col">
        <Providers>
          <Header/>
          {children}
          <MerkleLoader/>
          <BackgroundGlow/>
        </Providers>
      </body>
    </html>
  );
}
