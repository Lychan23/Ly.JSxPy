"use client"
import React, { useEffect } from 'react';
import dynamic from "next/dynamic";
import Link from "next/link";
import { ArrowRight, Github, Twitter, Zap, Book, Users, LucideIcon } from 'lucide-react';
import { useRouter } from 'next/navigation'; // Import useRouter

interface FeatureCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ icon: Icon, title, description }) => (
  <div className="card hover:shadow-lg transition-shadow duration-300">
    <Icon className="w-12 h-12 text-blue-500 mb-4" />
    <h3 className="text-xl font-semibold mb-2">{title}</h3>
    <p className="text-gray-600 dark:text-gray-300">{description}</p>
  </div>
);

const Home: React.FC = () => {
  const router = useRouter(); // Initialize useRouter

  useEffect(() => {
    const savedUsername = localStorage.getItem("username") || sessionStorage.getItem("username");
    
    // Check if the user is authenticated based on saved username
    if (savedUsername) {
      // Redirect to /auth if username exists
      router.push('/auth');
    }
  }, [router]);

  return (
    <div className="bg-gray-50 dark:bg-gray-900 min-h-screen">
      <main className="pt-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <section id="hero" className="text-center py-20 animate-fadeIn">
          <h1 className="text-5xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-purple-600">
            Welcome to Ly.JS
          </h1>
          <p className="text-xl mb-8 max-w-2xl mx-auto">
            A clean and efficient JavaScript library designed to simplify your development process.
          </p>
          <div className="flex justify-center space-x-4">
            <Link href="https://github.com/Lychan23/Ly.JSxPy">
              <button className="btn flex items-center">
                <Github className="mr-2" /> View on GitHub
              </button>
            </Link>
            <button className="btn-secondary flex items-center">
              Get Started <ArrowRight className="ml-2" />
            </button>
          </div>
        </section>

        <section id="features" className="py-20">
          <h2 className="text-3xl font-bold mb-12 text-center">Key Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <FeatureCard 
              icon={Zap} 
              title="Lightweight and Fast" 
              description="Optimized for performance to keep your applications speedy."
            />
            <FeatureCard 
              icon={ArrowRight} 
              title="Easy to Integrate" 
              description="Seamlessly fits into your existing projects with minimal setup."
            />
            <FeatureCard 
              icon={Book} 
              title="Comprehensive Docs" 
              description="Detailed documentation to get you up and running quickly."
            />
          </div>
        </section>

        <section id="about" className="py-20 bg-white dark:bg-gray-800 rounded-lg shadow-md p-8">
          <h2 className="text-3xl font-bold mb-6">About Ly.JS</h2>
          <p className="text-lg mb-6">
            Ly.JS is developed by a team of passionate developers who aim to provide a robust and user-friendly JavaScript library. With a focus on performance and simplicity, Ly.JS is perfect for both beginners and experienced developers.
          </p>
          <Link href="/about">
            <button className="btn-secondary">Learn More About Us</button>
          </Link>
        </section>

        <section id="contact" className="py-20 text-center">
          <h2 className="text-3xl font-bold mb-6">Get in Touch</h2>
          <p className="text-lg mb-8">
            Have questions or want to contribute? Reach out through our GitHub repository or follow us on social media for the latest updates.
          </p>
          <div className="flex justify-center space-x-4">
            <a href="https://github.com/Lychan23/Ly.JSxPy" className="btn flex items-center">
              <Github className="mr-2" /> GitHub
            </a>
            <a href="#" className="btn-secondary flex items-center">
              <Twitter className="mr-2" /> Twitter
            </a>
          </div>
        </section>
      </main>
      <footer className="bg-gray-900 text-white py-8 text-center">
        <p>&copy; 2024 Ly.JS Project. All rights reserved.</p>
        <div className="flex justify-center space-x-4 mt-4">
          <Link href="/privacy">Privacy Policy</Link>
          <Link href="/terms">Terms of Service</Link>
        </div>
      </footer>
    </div>
  );
}

export default Home;
