"use client";
import Link from 'next/link';

export default function Navbar() {
  return (
    <header className="bg-gray-900 text-white fixed w-full top-0 left-0 z-10 shadow-md">
      <div className="container mx-auto flex justify-between items-center p-4">
        <h1 className="text-xl font-bold">Welcome to Ly.JS</h1>
        <nav className="flex gap-4">
          <Link href="#intro" className="btn">Introduction</Link>
          <Link href="#features" className="btn">Features</Link>
          <Link href="#about" className="btn">About</Link>
          <Link href="#contact" className="btn">Contact</Link>
          <Link href="/login" className="btn">Login</Link>
        </nav>
      </div>
    </header>
  );
}
