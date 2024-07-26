// app/components/Navbar.tsx
"use client";
import Link from 'next/link';
import { useAuth } from '../context/authContext';

export default function Navbar() {
  const authContext = useAuth();
  const isVercel = process.env.NEXT_PUBLIC_IS_VERCEL === 'true';

  return (
    <header className="bg-gray-900 text-white fixed w-full top-0 left-0 z-10 shadow-md">
      <div className="container mx-auto flex justify-between items-center p-4">
        <h1 className="text-xl font-bold">Welcome to Ly.JS</h1>
        <nav className="flex gap-4">
          <Link href="#intro" className="btn">Introduction</Link>
          <Link href="#features" className="btn">Features</Link>
          <Link href="#about" className="btn">About</Link>
          <Link href="#contact" className="btn">Contact</Link>
          {isVercel ? (
            <Link href="/download" className="btn">Download</Link>
          ) : (
            <>
              {authContext?.loggedIn ? (
                <span className="btn">{authContext.username}</span>
              ) : (
                <>
                  <Link href="/login" className="btn">Login</Link>
                  <Link href="/register" className="btn">Register</Link>
                </>
              )}
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
