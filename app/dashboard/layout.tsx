// app/dashboard/layout.tsx
"use client";

import { Inter } from "next/font/google";
import "@/styles/globals.css";
import { AuthProvider } from "@/app/context/authContext";
import CookieConsent from "@/app/components/CookieConsent";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";

const inter = Inter({ subsets: ["latin"], weight: ["400", "500", "700"] });

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className} style={{ overflowY: 'hidden', overflowX: 'hidden', height: '100vh' }}>
        <div className="flex flex-col min-h-screen">
          <main className="flex-grow ">
            {children}
          </main>
          <CookieConsent />
          <Analytics />
          <SpeedInsights />
        </div>
      </body>
    </html>
  );
}
