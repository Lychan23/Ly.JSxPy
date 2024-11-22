"use client";
import { useState, FormEvent, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { useAuth, AIProviderSettings } from '../../context/authContext';
import ReactMarkdown from 'react-markdown';
import { Settings, Key, Send, X } from 'lucide-react';

// Define a type for the AI Provider structure
type AIProviderConfig = {
  label: string;
  models: string[];
};

// Define a more strict type for AI_PROVIDERS
type AIProvidersType = {
  [key in 'free' | 'openai']: AIProviderConfig;
};

// AI Provider Configuration with proper typing
const AI_PROVIDERS: AIProvidersType = {
  free: {
    label: 'Groq (Free)',
    models: [
      'llama-3.1-70b-versatile',
      'mixtral-8x7b-32768',
      'gemma-7b-it'
    ]
  },
  openai: {
    label: 'OpenAI',
    models: [
      'gpt-3.5-turbo',
      'gpt-4',
      'gpt-4-turbo',
      'gpt-4o'
    ]
  }
};

// Define types for messages
type Message = {
  role: 'user' | 'bot';
  content: string;
};

// Loading spinner component
const LoadingSpinner = () => (
  <div className="flex items-center justify-center space-x-2">
    {[1, 2, 3].map(dot => (
      <div 
        key={dot} 
        className="w-2.5 h-2.5 rounded-full animate-pulse bg-white"
      ></div>
    ))}
  </div>
);

// Error handling component
const ErrorMessage = ({ error }: { error: string }) => {
  return error ? (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-red-600/20 border border-red-500 text-red-400 p-3 rounded-lg mt-4 flex items-center space-x-2"
    >
      <X className="w-5 h-5 text-red-500" />
      <p className="flex-1">{error}</p>
    </motion.div>
  ) : null;
};

// Message list component with enhanced scrolling and styling
const MessageList = ({ messages }: { messages: Message[] }) => {
  const endOfMessages = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (endOfMessages.current) {
      endOfMessages.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  return (
    <div className="flex flex-col space-y-4 mb-4 overflow-y-auto max-h-[500px] pr-2 bg-gray-900 rounded-lg p-4 custom-scrollbar">
      {messages.map((message, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: index * 0.1 }}
          className={`p-4 rounded-lg max-w-[90%] break-words 
            ${message.role === "user"
              ? "bg-blue-700 text-white self-end ml-auto"
              : "bg-gray-800 text-gray-300 self-start"}
            shadow-md relative`}
        >
          <ReactMarkdown 
            components={{
              code: ({node, ...props}) => (
                <code 
                  className="bg-gray-900/50 rounded px-1 py-0.5 text-sm"
                  {...props}
                />
              ),
              pre: ({node, ...props}) => (
                <pre 
                  className="bg-gray-900/50 rounded p-2 overflow-x-auto text-sm"
                  {...props}
                />
              )
            }}
          >
            {message.content}
          </ReactMarkdown>
        </motion.div>
      ))}
      <div ref={endOfMessages}></div>
    </div>
  );
};

// Extend the type for the modal props
interface AISettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  provider: keyof AIProvidersType;
  userSettings?: AIProviderSettings;
  updateSettings: (settings: AIProviderSettings) => Promise<void>;
}

// AI Settings Modal Component with proper typing
const AISettingsModal = ({ 
  isOpen, 
  onClose, 
  provider, 
  userSettings,
  updateSettings 
}: AISettingsModalProps) => {
  const [apiKey, setApiKey] = useState(userSettings?.apiKey ?? '');
  const [selectedModel, setSelectedModel] = useState(
    userSettings?.selectedModel ?? AI_PROVIDERS[provider].models[0]
  );

  const handleSave = async () => {
    const settingsToUpdate: AIProviderSettings = {
      selectedModel,  // This is now valid since selectedModel is optional in the type
      ...(provider !== 'free' && { apiKey }),
      enabled: true
    };

    await updateSettings(settingsToUpdate);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
    >
      <motion.div
        initial={{ scale: 0.9 }}
        animate={{ scale: 1 }}
        className="bg-gray-800 rounded-xl shadow-2xl w-full max-w-md p-6 border border-gray-700"
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-white">
            {AI_PROVIDERS[provider].label} Settings
          </h2>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        
        {provider !== 'free' && (
          <div className="mb-4">
            <label className="block text-gray-300 mb-2 text-sm">API Key</label>
            <input 
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="w-full p-2.5 bg-gray-700 text-white rounded-md focus:ring-2 focus:ring-blue-500 transition-all"
              placeholder="Enter your API key"
            />
          </div>
        )}
        
        <div className="mb-6">
          <label className="block text-gray-300 mb-2 text-sm">Model</label>
          <select 
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value)}
            className="w-full p-2.5 bg-gray-700 text-white rounded-md focus:ring-2 focus:ring-blue-500 transition-all"
          >
            {AI_PROVIDERS[provider].models.map((model: string) => (
              <option key={model} value={model}>{model}</option>
            ))}
          </select>
        </div>
        
        <div className="flex justify-end space-x-3">
          <button 
            onClick={onClose} 
            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={handleSave} 
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Save
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

// Input form component type
type InputFormProps = {
  input: string;
  setInput: (val: string) => void;
  handleSubmit: (e: FormEvent) => void;
  loading: boolean;
};

// Input form component with enhanced design
const InputForm = ({ 
  input, 
  setInput, 
  handleSubmit, 
  loading 
}: InputFormProps) => {
  return (
    <form onSubmit={handleSubmit} className="flex items-center space-x-3">
      <motion.input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Ask me anything..."
        className="flex-1 p-3.5 border border-gray-700 rounded-lg bg-gray-800 text-gray-200 
          focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all 
          placeholder-gray-500"
        whileFocus={{ scale: 1.02 }}
        disabled={loading}
      />
      <motion.button
        type="submit"
        disabled={loading || input.trim() === ''}
        className={`
          p-3 rounded-lg transition-all 
          ${loading || input.trim() === '' 
            ? 'bg-gray-700 text-gray-500 cursor-not-allowed' 
            : 'bg-blue-600 text-white hover:bg-blue-700 active:scale-95'}
        `}
        whileTap={{ scale: 0.95 }}
      >
        {loading ? <LoadingSpinner /> : <Send className="w-5 h-5" />}
      </motion.button>
    </form>
  );
};

// Main AI Assistant Page
export default function AIPage() {
  const { 
    loggedIn, 
    user, 
    updateAIProviderSettings 
  } = useAuth();
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<keyof AIProvidersType>('free');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (input.trim() === '') return;

    setError("");
    setLoading(true);
    
    const userMessage: Message = { role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);

    try {
      const selectedProviderSettings = user?.settings?.aiProviders?.[selectedProvider];
      
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          query: input,
          provider: selectedProvider,
          apiKey: selectedProviderSettings?.apiKey,
          model: selectedProviderSettings?.selectedModel
        }),
      });

      if (!res.ok) {
        throw new Error(`Error: ${res.statusText}`);
      }

      const data = await res.json();
      const botMessage: Message = { role: "bot", content: data.result };
      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      const errorMessage = error instanceof Error 
        ? `Failed to fetch: ${error.message}` 
        : "An unknown error occurred";
      setError(errorMessage);
    } finally {
      setLoading(false);
      setInput("");
    }
  };

  const openProviderSettings = (provider: keyof AIProvidersType) => {
    setSelectedProvider(provider);
    setSettingsModalOpen(true);
  };

  const updateSettings = async (settings: AIProviderSettings) => {
    await updateAIProviderSettings(selectedProvider, settings);
  };

  if (!loggedIn) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="p-8 bg-gray-800 rounded-xl shadow-2xl text-white text-center"
        >
          <h2 className="text-2xl font-bold mb-4">Access Restricted</h2>
          <p className="text-gray-400 mb-6">Please log in to access the AI Assistant.</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 py-8 px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="flex flex-col w-full max-w-4xl bg-gray-900 border border-gray-800 rounded-xl shadow-2xl overflow-hidden"
      >
        <div className="bg-gray-800 p-6 flex justify-between items-center border-b border-gray-700">
          <h1 className="text-3xl font-bold text-white">AI Assistant</h1>
          <div className="flex space-x-2">
            {(Object.keys(AI_PROVIDERS) as Array<keyof AIProvidersType>).map(provider => (
              <motion.button
                key={provider}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => openProviderSettings(provider)}
                className={`
                  p-2.5 rounded-lg transition-all 
                  ${selectedProvider === provider 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-700 text-gray-400 hover:bg-gray-600'}
                `}
              >
                {provider === 'free' ? <Settings size={20} /> : <Key size={20} />}
              </motion.button>
            ))}
          </div>
        </div>

        <div className="flex-1 p-6">
          <MessageList messages={messages} />
        </div>

        <div className="p-6 pt-0">
          <InputForm 
            input={input} 
            setInput={setInput} 
            handleSubmit={handleSubmit} 
            loading={loading} 
          />
          
          <ErrorMessage error={error} />
        </div>
      </motion.div>

      <AISettingsModal 
  isOpen={settingsModalOpen}
  onClose={() => setSettingsModalOpen(false)}
  provider={selectedProvider}
  userSettings={user?.settings?.aiProviders?.[selectedProvider]}
  updateSettings={updateSettings}
  />
    </div>
  );
}