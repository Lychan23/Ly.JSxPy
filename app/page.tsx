"use client";
import dynamic from 'next/dynamic';

const Navbar = dynamic(() => import('@/app/components/Navbar'));
const Section = dynamic(() => import('@/app/components/Section'));

export default function Home() {
  return (
    <div className="bg-gray-100">
      <Navbar />
      <main className="pt-20">
        <Section id="intro" title="Introduction">
          <p>
            Ly.JS is a clean and efficient JavaScript library designed to simplify your development process. Explore the powerful features and easy-to-use API that Ly.JS offers.
          </p>
          <button className="btn mt-4" onClick={() => window.location.href='https://github.com/Lychan23/Ly.JSxPy'}>
            View on GitHub
          </button>
        </Section>
        <Section id="features" title="Features">
          <ul className="list-disc list-inside">
            <li>Lightweight and Fast</li>
            <li>Easy to Integrate</li>
            <li>Comprehensive Documentation</li>
            <li>Active Community Support</li>
          </ul>
        </Section>
        <Section id="about" title="About">
          <p>
            Ly.JS is developed by a team of passionate developers who aim to provide a robust and user-friendly JavaScript library. With a focus on performance and simplicity, Ly.JS is perfect for both beginners and experienced developers.
          </p>
        </Section>
        <Section id="contact" title="Contact Us">
          <p>
            Have questions? Feel free to reach out through our GitHub repository or follow us on social media for the latest updates.
          </p>
        </Section>
      </main>
      <footer className="bg-gray-900 text-white py-4 text-center">
        <p>&copy; 2024 Ly.JS Project. All rights reserved.</p>
      </footer>
    </div>
  );
}