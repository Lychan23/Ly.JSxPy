

import { Inter } from "next/font/google";
import "@/styles/globals.css";
import { AuthProvider } from "@/app/context/authContext";
import CookieConsent from "@/app/components/CookieConsent";
import Navbar from "@/app/components/Navbar";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";

const inter = Inter({ subsets: ["latin"], weight: ["400", "500", "700"] });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          <div className="flex flex-col min-h-screen">
            <Navbar />
            <main className="flex-grow pt-16">
              {children}
            </main>
            <CookieConsent />
            <Analytics />
            <SpeedInsights />
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
