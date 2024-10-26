import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "@/styles/globals.css";
import dynamic from "next/dynamic";
import { AuthProvider } from "@/app/context/authContext";

// Dynamically imported components
const CookieConsent = dynamic(() => import("@/app/components/CookieConsent"), { ssr: false });
const Navbar = dynamic(() => import("@/app/components/Navbar"));
const SpeedInsights = dynamic(() =>
  import("@vercel/speed-insights/next").then(mod => mod.SpeedInsights), { ssr: false });
const Analytics = dynamic(() =>
  import("@vercel/analytics/react").then(mod => mod.Analytics), { ssr: false });

// Load the Inter font
const inter = Inter({ subsets: ["latin"], weight: ["400", "500", "700"] });

export const metadata: Metadata = {
  title: "Ly.JSxPY",
  description: "Ly.JSxPY system",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          <div className="flex flex-col min-h-screen">
            <Navbar />
            <main className="flex-grow pt-16"> {/* Adjusted padding-top */}
              {children}
            </main>
          </div>
          <CookieConsent />
          <Analytics />
          <SpeedInsights />
        </AuthProvider>
      </body>
    </html>
  );
}
