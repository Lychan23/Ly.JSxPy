'use client';

import { Inter } from "next/font/google";
import "@/styles/globals.css";
import { AuthProvider } from "@/app/context/authContext";
import CookieConsent from "@/app/components/CookieConsent";
import Navbar from "@/app/components/Navbar";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { usePathname } from 'next/navigation';

const inter = Inter({ subsets: ["latin"], weight: ["400", "500", "700"] });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isDashboard = pathname?.startsWith('/dashboard');

  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          <div className="flex flex-col min-h-screen">
            {/* Only show Navbar on non-dashboard pages */}
            {!isDashboard && <Navbar />}
            <main className={`flex-grow ${!isDashboard ? 'pt-16' : ''}`}>
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