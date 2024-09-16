import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "@/styles/globals.css";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Analytics } from '@vercel/analytics/react';
import Navbar from "@/app/components/Navbar";
import CookieConsent from "@/app/components/CookieConsent";
import { AuthProvider } from "@/app/context/authContext";

// Import Inter font from Google Fonts
const inter = Inter({ subsets: ["latin"], weight: ["400", "500", "700"] });

export const metadata: Metadata = {
  title: "Ly.JSxPY",
  description: "Ly.JSxPY system",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          <Navbar />
          <main className="pt-20">
            {children}
          </main>
          <CookieConsent />
          <Analytics />
          <SpeedInsights />
          <footer className="bg-gray-900 text-white py-4 text-center">
            <p>&copy; 2024 Ly.JS Project. All rights reserved.</p>
          </footer>
        </AuthProvider>
      </body>
    </html>
  );
}
