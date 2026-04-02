import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { AuthProvider } from "@/contexts/AuthContext";
import ChatAssistant from "@/components/ChatAssistant";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "AuctionET - Ethiopia's Premier Auction Platform",
  description: "Discover unique items, place bids, and win incredible deals",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} font-sans antialiased`}>
        <AuthProvider>
          <LanguageProvider>
            {children}
            <ChatAssistant />
          </LanguageProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
