import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import StyledComponentsRegistry from "./lib/registry";
import React from "react";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Diverty",
};

// async function getTrendingStocks(region = 'US') {
//   const res = await fetch(`/api/search?region=${region}`, { cache: "no-store" });

//   if (!res.ok) {
//     throw new Error("Failed to fetch trending stocks");
//   }

//   return res.json();
// }

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // const data = await getTrendingStocks("US"); // Prefetch on server!
  // const stocks = {symbol: "asd", shortName: "asd"};
  return (
    
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
      {/* <StyledComponentsRegistry>{children}</StyledComponentsRegistry> */}
      {children}
      </body>
    </html>
    
  );
}
