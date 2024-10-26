"use client"
import React, { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "../context/authContext";
import {
  Home,
  Book,
  Info,
  Mail,
  Download,
  User,
  Settings,
  LogOut,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const navItems = [
  { href: "/#intro", label: "Introduction", icon: Home },
  { href: "/#features", label: "Features", icon: Book },
  { href: "/#about", label: "About", icon: Info },
  { href: "/#contact", label: "Contact", icon: Mail },
  { href: "/documentation", label: "Documentation", icon: Book },
];

export default function Navbar() {
  const [activeLink, setActiveLink] = useState<string>("#intro");
  const authContext = useAuth();
  const isVercel = process.env.NEXT_PUBLIC_IS_VERCEL === "true";
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const hash = window.location.hash || "#intro"; // Default to "#intro"
    setActiveLink(hash);
  }, [pathname]);

  const handleNavigation = (href: string) => {
    if (href.startsWith("/#")) {
      router.push(href);
      const element = document.querySelector(href.replace("/", ""));
      if (element) element.scrollIntoView({ behavior: "smooth" });
    } else {
      router.push(href);
    }
    setActiveLink(href);
  };

  const handleLogout = async () => {
    try {
      if (authContext?.logout) {
        await authContext.logout();
        router.push("/auth");
      }
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <header className="fixed top-0 left-0 w-full z-50">
      <nav className="backdrop-blur-lg bg-black/30 shadow-lg m-0 p-0 border-b-0">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-2xl font-bold tracking-wide uppercase text-white">
              Welcome to Ly.JS
            </h1>

            <div className="flex gap-4 items-center text-lg font-medium">
              {navItems.map((item) => (
                <Button
                  key={item.href}
                  variant="ghost"
                  onClick={() => handleNavigation(item.href)}
                  className={`relative hover:text-blue-400 transition-colors ${
                    activeLink === item.href ? "text-white" : "text-gray-300"
                  }`}
                >
                  <item.icon className="w-5 h-5 mr-2" />
                  {item.label}
                  {activeLink === item.href && (
                    <span className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-400 rounded"></span>
                  )}
                </Button>
              ))}

              {isVercel ? (
                <Button
                  variant="ghost"
                  onClick={() => handleNavigation("/download")}
                  className={`relative hover:text-blue-400 transition-colors ${
                    activeLink === "/download" ? "text-white" : "text-gray-300"
                  }`}
                >
                  <Download className="w-5 h-5 mr-2" />
                  Download
                </Button>
              ) : (
                <>
                  {authContext?.loggedIn ? (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          className="text-white hover:text-blue-400"
                        >
                          <User className="w-5 h-5 mr-2" />
                          {authContext.username}
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="w-56 bg-black/70 backdrop-blur-md text-white">
                        <DropdownMenuItem
                          onClick={() => handleNavigation("/dashboard/profile")}
                        >
                          <User className="mr-2 h-4 w-4" />
                          <span>Profile</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() =>
                            handleNavigation("/dashboard/settings")
                          }
                        >
                          <Settings className="mr-2 h-4 w-4" />
                          <span>Settings</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={handleLogout}>
                          <LogOut className="mr-2 h-4 w-4" />
                          <span>Logout</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  ) : (
                    <>
                      <Button
                        variant="ghost"
                        onClick={() => handleNavigation("/auth?mode=login")}
                        className={`relative hover:text-blue-400 transition-colors ${
                          activeLink === "/auth?mode=login"
                            ? "text-white"
                            : "text-gray-300"
                        }`}
                      >
                        Login
                      </Button>
                      <Button
                        variant="ghost"
                        onClick={() => handleNavigation("/auth?mode=register")}
                        className={`relative hover:text-blue-400 transition-colors ${
                          activeLink === "/auth?mode=register"
                            ? "text-white"
                            : "text-gray-300"
                        }`}
                      >
                        Register
                      </Button>
                    </>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </nav>
    </header>
  );
}
