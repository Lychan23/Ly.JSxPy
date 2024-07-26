// app/dashboard/control-panel/page.tsx
'use client';

import { useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";
import Link from 'next/link';
import chalk from 'chalk';

interface Stats {
  cpu: string;
  memory: string;
  networkInbound: string;
  networkOutbound: string;
  uptime: string;
  currentTasks: string;
}

const applyColorCoding = (message: string, type: string): string => {
  switch (type) {
    case 'INFO':
      return chalk.blue(message);
    case 'WARNING':
      return chalk.yellow(message);
    case 'ERROR':
      return chalk.red(message);
    case 'CRITICAL':
      return chalk.bgRed.white(message);
    default:
      return message;
  }
};

const ControlPanel = () => {
  const [log, setLog] = useState<string[]>([]);
  const [uvicornLog, setUvicornLog] = useState<string[]>([]);
  const [stats, setStats] = useState<Partial<Stats>>({});
  const [theme, setTheme] = useState("dark");
  const [users, setUsers] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [messageInput, setMessageInput] = useState("");

  useEffect(() => {
    const socket: Socket = io();

    const handleLog = (data: string, type: string = 'INFO') => {
      const coloredLog = applyColorCoding(data, type);
      setLog((prev) => [...prev, coloredLog]);
    };

    socket.on("log", (data: string) => handleLog(data));
    socket.on("stats", (data: Stats) => setStats(data));
    socket.on("activity", (data: string) => handleLog(data, 'INFO'));
    socket.on("userList", (users: string[]) => setUsers(users));
    socket.on("message", (data: string) => handleLog(data, 'INFO'));
    socket.on("uvicornLog", (data: string) => setUvicornLog((prev) => [...prev, data]));

    fetchTheme();
    fetchStats();

    return () => {
      socket.off("log");
      socket.off("stats");
      socket.off("activity");
      socket.off("userList");
      socket.off("message");
      socket.off("uvicornLog");
    };
  }, []);

  const fetchTheme = async () => {
    try {
      const res = await fetch("/api/load-theme");
      if (!res.ok) {
        throw new Error(await res.text());
      }
      const data = await res.json();
      setTheme(data.theme);
      document.body.classList.add(data.theme);
    } catch (error: unknown) {
      if (error instanceof Error) {
        setError(`Failed to load theme: ${error.message}`);
      } else {
        setError("Failed to load theme");
      }
    }
  };

  const toggleTheme = async () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    try {
      await fetch("/api/save-theme", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ theme: newTheme }),
      });
      setTheme(newTheme);
      document.body.classList.remove(theme);
      document.body.classList.add(newTheme);
    } catch (error: unknown) {
      if (error instanceof Error) {
        setError(`Failed to save theme: ${error.message}`);
      } else {
        setError("Failed to save theme");
      }
    }
  };

  const startBot = async () => {
    try {
      const res = await fetch("/api/start", { method: "POST" });
      if (!res.ok) {
        throw new Error(await res.text());
      }
      setLog((prev) => [...prev, applyColorCoding("Bot started", 'INFO')]);
    } catch (error: unknown) {
      if (error instanceof Error) {
        setError(`Failed to start bot: ${error.message}`);
      } else {
        setError("Failed to start bot");
      }
    }
  };

  const fetchStats = async () => {
    try {
      const res = await fetch("/api/stats");
      if (!res.ok) {
        throw new Error(await res.text());
      }
      const data: Stats = await res.json();
      setStats(data);
    } catch (error: unknown) {
      if (error instanceof Error) {
        setError(`Failed to fetch stats: ${error.message}`);
      } else {
        setError("Failed to fetch stats");
      }
    }
  };

  const stopBot = async () => {
    try {
      await fetch("/api/stop", { method: "POST" });
      setLog((prev) => [...prev, applyColorCoding("Bot stopped", 'INFO')]);
    } catch (error: unknown) {
      if (error instanceof Error) {
        setError(`Failed to stop bot: ${error.message}`);
      } else {
        setError("Failed to stop bot");
      }
    }
  };

  const startServer = async () => {
    try {
      await fetch("/api/start-server", { method: "POST" });
      setLog((prev) => [...prev, applyColorCoding("Server started", 'INFO')]);
    } catch (error: unknown) {
      if (error instanceof Error) {
        setError(`Failed to start server: ${error.message}`);
      } else {
        setError("Failed to start server");
      }
    }
  };

  const sendMessageToDiscord = async () => {
    try {
      await fetch("/api/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message: messageInput }),
      });
      setMessageInput("");
    } catch (error: unknown) {
      if (error instanceof Error) {
        setError(`Failed to send message to Discord: ${error.message}`);
      } else {
        setError("Failed to send message to Discord");
      }
    }
  };

  const startPanel1 = async () => {
    try {
      const res = await fetch("/api/start-panel1", { method: "POST" });
      if (!res.ok) {
        throw new Error(await res.text());
      }
      setUvicornLog((prev) => [...prev, applyColorCoding("Panel 1 started", 'INFO')]);
    } catch (error: unknown) {
      if (error instanceof Error) {
        setError(`Failed to start Panel 1: ${error.message}`);
      } else {
        setError("Failed to start Panel 1");
      }
    }
  };

  return (
    <div className={`min-h-screen flex`}>
      <div className="flex flex-col p-4 bg-gray-800 text-white w-64">
        <h2 className="text-xl font-semibold mb-4">Control Panel</h2>
        <button
          onClick={startBot}
          className="bg-blue-500 text-white p-2 rounded hover:bg-blue-600 mb-2"
        >
          Start Bot
        </button>
        <button
          onClick={stopBot}
          className="bg-blue-500 text-white p-2 rounded hover:bg-blue-600 mb-2"
        >
          Stop Bot
        </button>
        <button
          onClick={startServer}
          className="bg-blue-500 text-white p-2 rounded hover:bg-blue-600 mb-2"
        >
          Start Server
        </button>
        <Link href="/command_builder" legacyBehavior>
          <a className="bg-green-500 text-white p-2 rounded hover:bg-green-600 mb-2">
            Go to Command Builder
          </a>
        </Link>
        <h2 className="text-xl font-semibold mb-4">Panels Control</h2>
        <button
          onClick={startPanel1}
          className="bg-blue-500 text-white p-2 rounded hover:bg-blue-600 mb-2"
        >
          Start Panel 1
        </button>
        <button
          onClick={toggleTheme}
          className="bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
        >
          Toggle Theme
        </button>
      </div>
      <div className={`flex-grow p-8 rounded shadow-md w-full max-w-2xl control-panel ${theme}`}>
        <h1 className="text-2xl font-bold mb-4 text-center">Bot Control Panel</h1>
        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
        <div className="mb-4 flex space-x-2 justify-center">
          <input
            type="text"
            id="discordMessage"
            placeholder="Enter text to send to Discord"
            className="p-2 border border-gray-300 rounded w-full"
            value={messageInput}
            onChange={(e) => setMessageInput(e.target.value)}
          />
          <button
            onClick={sendMessageToDiscord}
            className="bg-blue-500 text-white p-2 rounded ml-2 hover:bg-blue-600"
          >
            Send
          </button>
        </div>
        <div id="log" className="mb-4">
          <h2 className="text-xl font-semibold mb-2">Log</h2>
          <div className="bg-gray-100 p-4 rounded h-40 overflow-y-auto dark:bg-gray-800 dark:text-gray-200">
            {log.map((entry, index) => (
              <div key={index} className="text-sm">{entry}</div>
            ))}
          </div>
        </div>
        <div id="stats" className="mb-4">
          <h2 className="text-xl font-semibold mb-2">Stats</h2>
          <div className="bg-gray-100 p-4 rounded dark:bg-gray-800 dark:text-gray-200">
            <p>CPU Load: {stats.cpu || "N/A"}</p>
            <p>Memory Usage: {stats.memory || "N/A"}</p>
            <p>Network Inbound: {stats.networkInbound || "N/A"}</p>
            <p>Network Outbound: {stats.networkOutbound || "N/A"}</p>
            <p>Uptime: {stats.uptime || "N/A"}</p>
            <p>Current Tasks: {stats.currentTasks || "N/A"}</p>
          </div>
        </div>
        <div id="users" className="mb-4">
          <h2 className="text-xl font-semibold mb-2">Users</h2>
          <div className="bg-gray-100 p-4 rounded h-40 overflow-y-auto dark:bg-gray-800 dark:text-gray-200">
            {users.map((user, index) => (
              <div key={index} className="text-sm">{user}</div>
            ))}
          </div>
        </div>
      </div>
      <div className="flex flex-col p-4 bg-gray-800 text-white w-64">
        <h2 className="text-xl font-semibold mb-4">Uvicorn Log</h2>
        <div className="bg-gray-100 p-4 rounded h-96 overflow-y-auto dark:bg-gray-800 dark:text-gray-200">
          {uvicornLog.map((entry, index) => (
            <div key={index} className="text-sm">{entry}</div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ControlPanel;
