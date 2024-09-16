"use client"
import React, { useState, useEffect, Suspense } from 'react';
import { motion } from 'framer-motion';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { z } from 'zod';
import { useAuth } from '@/app/context/authContext';

// Define Zod schemas for form validation
const loginSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

const registerSchema = loginSchema.extend({
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

const AuthForm = () => {
  const searchParams = useSearchParams();
  const mode = searchParams ? searchParams.get('mode') : null;
  const router = useRouter();
  const authContext = useAuth();

  const [isLogin, setIsLogin] = useState(mode !== 'register');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setIsLogin(mode !== 'register');
  }, [mode]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');

    try {
      if (isLogin) {
        loginSchema.parse({ username, password });
        if (authContext) {
          await authContext.login(username, password, remember);
          router.push('/dashboard'); // Redirect to dashboard after successful login
        }
      } else {
        registerSchema.parse({ username, password, confirmPassword });
        const response = await fetch('/api/register', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ username, password }),
        });
        if (response.ok) {
          router.push('/login');
        } else {
          const data = await response.json();
          setError(data.message);
        }
      }
    } catch (err) {
      if (err instanceof z.ZodError) {
        setError(err.errors[0].message);
      } else {
        setError('An unexpected error occurred');
      }
    }
  };

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  };

  const formVariants = {
    hidden: { x: isLogin ? -50 : 50, opacity: 0 },
    visible: { x: 0, opacity: 1, transition: { duration: 0.5 } },
  };

  return (
    <motion.div
      className="bg-gray-800 p-8 rounded-lg shadow-lg w-full max-w-md"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.div
        key={isLogin ? 'login' : 'register'}
        variants={formVariants}
        initial="hidden"
        animate="visible"
      >
        <h2 className="text-3xl font-bold mb-6 text-center text-white">
          {isLogin ? 'Welcome Back!' : 'Create Account'}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-300">
              Username
            </label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="mt-1 block w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              required
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-300">
              Password
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              required
            />
          </div>
          {!isLogin && (
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300">
                Confirm Password
              </label>
              <input
                type="password"
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="mt-1 block w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                required
              />
            </div>
          )}
          {isLogin && (
            <label className="flex items-center text-gray-300">
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                className="mr-2"
              />
              Remember me
            </label>
          )}
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button
            type="submit"
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            {isLogin ? 'Sign In' : 'Sign Up'}
          </button>
        </form>
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-400">
            {isLogin ? "Don't have an account?" : "Already have an account?"}
            <Link
              href={isLogin ? "/auth?mode=register" : "/auth?mode=login"}
              className="font-medium text-indigo-400 hover:text-indigo-300 ml-1"
            >
              {isLogin ? 'Sign up' : 'Sign in'}
            </Link>
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
};

const AuthPage = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-black">
      <Suspense fallback={<div className="text-white">Loading...</div>}>
        <AuthForm />
      </Suspense>
    </div>
  );
};

export default AuthPage;