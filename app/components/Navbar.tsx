"use client";
import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '../context/authContext';

export default function Navbar() {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const authContext = useAuth();
  const isVercel = process.env.NEXT_PUBLIC_IS_VERCEL === 'true';

  const toggleDropdown = () => setIsDropdownOpen(!isDropdownOpen);

  const handleLogout = () => {
    // Handle logout logic here
  };

  return (
    <header className="bg-gray-900 text-white fixed w-full top-0 left-0 z-10 shadow-md">
      <div className="container mx-auto flex justify-between items-center p-4">
        <h1 className="text-xl font-bold">Welcome to Ly.JS</h1>
        <nav className="flex gap-4 items-center">
          <Link href="#intro" className="btn">Introduction</Link>
          <Link href="#features" className="btn">Features</Link>
          <Link href="#about" className="btn">About</Link>
          <Link href="#contact" className="btn">Contact</Link>
          <Link href="/documentation" className="btn">Documentation</Link>
          {isVercel ? (
            <Link href="/download" className="btn">Download</Link>
          ) : (
            <>
              {authContext?.loggedIn ? (
                <div className="relative">
                  <button
                    className="btn flex items-center gap-2"
                    onClick={toggleDropdown}
                  >
                    {authContext.username}
                    <svg
                      className={`w-4 h-4 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {isDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-gray-800 rounded-md shadow-lg">
                      <Link href="/profile" className="block px-4 py-2 text-white hover:bg-gray-700">Profile</Link>
                      <Link href="/settings" className="block px-4 py-2 text-white hover:bg-gray-700">Settings</Link>
                      <button onClick={handleLogout} className="block w-full text-left px-4 py-2 text-white hover:bg-gray-700">Logout</button>
                    </div>
                  )}
                </div>
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
