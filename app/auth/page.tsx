"use client";
import React, { useState, useEffect, Suspense } from "react";
import { motion } from "framer-motion";
import { useSearchParams, useRouter } from "next/navigation";
import { z } from "zod";
import { useAuth } from "@/app/context/authContext";
import dynamic from "next/dynamic";
import { User, Lock, Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

// Dynamic imports for performance
const Toast = dynamic(() =>
  import("@/components/ui/toast").then((mod) => mod.Toast)
);

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
  const mode = searchParams ? searchParams.get("mode") : null;
  const router = useRouter();
  const authContext = useAuth();

  const [isLogin, setIsLogin] = useState(mode !== "register");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    // Check for saved credentials
    if (isLogin) {
      const savedUsername = localStorage.getItem("username") || sessionStorage.getItem("username");
      const savedPassword = localStorage.getItem("password") || sessionStorage.getItem("password");
  
      if (savedUsername) {
        setUsername(savedUsername);
      }
  
      if (savedPassword) {
        setPassword(savedPassword);
      }
    }
  
    setIsLogin(mode !== "register");
  }, [mode, isLogin]);

  useEffect(() => {
    // Automatic login when both username and password are filled
    const performLogin = async () => {
      if (isLogin && username && password) {
        try {
          // Validate login form inputs
          loginSchema.parse({ username, password });
          if (authContext) {
            const response = await authContext.login(username, password, remember);
            if (response.success) {
              // Store credentials if "Remember Me" is checked
              if (remember) {
                localStorage.setItem("username", username);
                localStorage.setItem("password", password); // Ensure password is hashed on the server side, not stored directly
              } else {
                sessionStorage.setItem("username", username);
                sessionStorage.setItem("password", password); // Ensure password is hashed on the server side, not stored directly
              }
              router.push("/dashboard");
            } else {
              setError(response.message || "Login failed");
            }
          }
        } catch (err) {
          if (err instanceof z.ZodError) {
            setError(err.errors[0].message);
          } else {
            setError("An unexpected error occurred");
          }
        }
      }
    };

    performLogin();
  }, [isLogin, username, password, remember, authContext, router]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    try {
      if (isLogin) {
        // Validate login form inputs
        loginSchema.parse({ username, password });
      } else {
        // Validate registration form inputs
        registerSchema.parse({ username, password, confirmPassword });
        const response = await fetch("/api/register", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ username, password }),
        });

        if (response.ok) {
          router.push("/login");
        } else {
          const data = await response.json();
          setError(data.message);
        }
      }
    } catch (err) {
      if (err instanceof z.ZodError) {
        setError(err.errors[0].message);
      } else {
        setError("An unexpected error occurred");
      }
    }
  };
  
  const containerVariants = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: { opacity: 1, scale: 1, transition: { duration: 0.5 } },
  };

  const formVariants = {
    hidden: { x: isLogin ? -50 : 50, opacity: 0 },
    visible: { x: 0, opacity: 1, transition: { duration: 0.5 } },
  };

  return (
    <motion.div
      className="bg-white bg-opacity-10 backdrop-filter backdrop-blur-lg p-8 rounded-lg shadow-2xl w-full max-w-xl mx-auto border border-white border-opacity-20"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.div
        key={isLogin ? "login" : "register"}
        variants={formVariants}
        initial="hidden"
        animate="visible"
      >
        <h2 className="text-4xl font-bold mb-8 text-center text-white font-serif">
          {isLogin ? "Welcome Back!" : "Create Account"}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="username" className="text-sm font-medium text-gray-300">
              Username
            </Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <Input
                type="text"
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="pl-10 bg-white bg-opacity-10 border-gray-600 text-white placeholder-gray-400"
                required
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="password" className="text-sm font-medium text-gray-300">
              Password
            </Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <Input
                type={showPassword ? "text" : "password"}
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10 pr-10 bg-white bg-opacity-10 border-gray-600 text-white placeholder-gray-400"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>
          {!isLogin && (
            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-sm font-medium text-gray-300">
                Confirm Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <Input
                  type={showConfirmPassword ? "text" : "password"}
                  id="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="pl-10 pr-10 bg-white bg-opacity-10 border-gray-600 text-white placeholder-gray-400"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
          )}
          {isLogin && (
            <div className="flex items-center space-x-2">
              <Checkbox
                id="remember"
                checked={remember}
                onCheckedChange={(checked) => setRemember(checked as boolean)}
                className="data-[state=checked]:bg-indigo-600"
              />
              <Label
                htmlFor="remember"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-gray-300"
              >
                Remember me
              </Label>
            </div>
          )}
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <Button
            type="submit"
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
          >
            {isLogin ? "Sign In" : "Sign Up"}
          </Button>
        </form>
      </motion.div>
    </motion.div>
  );
};

const AuthPage = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-blue-900 via-black to-purple-900 p-4">
      <Suspense fallback={<div className="text-white text-2xl">Loading...</div>}>
        <AuthForm />
      </Suspense>
    </div>
  );
};

export default AuthPage;