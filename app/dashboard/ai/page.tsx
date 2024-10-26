"use client";
import { useState, FormEvent, useEffect, useRef } from "react";
import { motion } from "framer-motion"; // For animations
import { useAuth } from '../../context/authContext'; // Import useAuth for authentication
import ReactMarkdown from 'react-markdown'; // Markdown support

// Loading spinner component
const LoadingSpinner = () => (
  <div className="flex items-center justify-center space-x-2">
    <div className="w-4 h-4 rounded-full animate-pulse bg-blue-500"></div>
    <div className="w-4 h-4 rounded-full animate-pulse bg-blue-600"></div>
    <div className="w-4 h-4 rounded-full animate-pulse bg-blue-700"></div>
  </div>
);

// Error handling component
const ErrorMessage = ({ error }: { error: string }) => {
  return error ? <p className="text-red-400 mt-4">{error}</p> : null;
};

// Message list component
const MessageList = ({ messages }: { messages: { role: string; content: string }[] }) => {
  const endOfMessages = useRef<HTMLDivElement>(null);

  // Scroll to the latest message
  useEffect(() => {
    if (endOfMessages.current) {
      endOfMessages.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  return (
    <div className="flex flex-col space-y-4 mb-4 overflow-y-auto max-h-96 pr-4 bg-gray-800 rounded-lg shadow-inner p-4 transition-all">
      {messages.map((message, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: index * 0.1 }}
          className={`p-4 rounded-lg ${message.role === "user"
            ? "bg-blue-600 text-white self-end"
            : "bg-gray-700 text-gray-300 self-start"
          } shadow-md`}
        >
          {/* Render Markdown content */}
          <ReactMarkdown>{message.content}</ReactMarkdown>
        </motion.div>
      ))}
      <div ref={endOfMessages}></div> {/* Scroll to this div when new messages appear */}
    </div>
  );
};

// Input form component
const InputForm = ({ input, setInput, handleSubmit, loading }: { input: string, setInput: (val: string) => void, handleSubmit: (e: FormEvent) => void, loading: boolean }) => {
  return (
    <form onSubmit={handleSubmit} className="flex items-center space-x-4">
      <motion.input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Enter your query"
        className="flex-1 p-3 border border-gray-600 rounded-lg shadow-sm bg-gray-800 text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
        whileFocus={{ scale: 1.02 }} // Subtle scaling on focus
        whileHover={{ scale: 1.02 }} // Slight scale on hover
        disabled={loading} // Disable input while loading
      />
      <motion.button
        type="submit"
        className={`px-4 py-2 ${loading ? "bg-blue-300" : "bg-blue-500"} text-white rounded-lg shadow-lg transition-all`}
        whileTap={{ scale: 0.98 }} // Scale down on tap
        whileHover={{ scale: !loading ? 1.05 : 1 }} // Scale up on hover only if not loading
        disabled={loading} // Disable button while loading
      >
        {loading ? <LoadingSpinner /> : "Send"}
      </motion.button>
    </form>
  );
};

// Main AIPage component
export default function AIPage() {
  const { loggedIn, username } = useAuth(); // Destructure loggedIn and username from authContext
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<{ role: string; content: string }[]>([]);
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState(false); // Loading state for form and fetch

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true); // Start loading
    const userMessage = { role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);

    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ query: input }),
      });

      if (!res.ok) {
        if (res.status === 500) {
          throw new Error("Server error, please try again later.");
        } else if (res.status === 404) {
          throw new Error("API not found. Check your endpoint.");
        } else {
          throw new Error(`Error: ${res.statusText}`);
        }
      }

      const data = await res.json();
      const botMessage = { role: "bot", content: data.result };
      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      if (error instanceof Error) {
        setError(`Failed to fetch: ${error.message}`);
      } else {
        setError("An unknown error occurred");
      }
    } finally {
      setLoading(false); // Stop loading
    }

    setInput("");
  };

  if (!loggedIn) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="p-6 bg-gray-800 rounded-lg shadow-lg text-white"
        >
          <h2 className="text-2xl font-bold text-center">
            Please log in to access the AI Assistant.
          </h2>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 py-6 px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="flex flex-col w-full max-w-3xl bg-gray-800 rounded-lg shadow-lg p-6"
      >
        <h1 className="text-3xl font-bold mb-6 text-gray-200 text-center">
          AI Assistant
        </h1>

        {/* Message list displaying user and bot messages */}
        <MessageList messages={messages} />
        
        {/* Input form for user query */}
        <InputForm input={input} setInput={setInput} handleSubmit={handleSubmit} loading={loading} />

        {/* Error message component */}
        <ErrorMessage error={error} />
      </motion.div>
    </div>
  );
}
