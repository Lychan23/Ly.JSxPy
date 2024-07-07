"use client";
import { useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";

interface Stats {
  cpu: string;
  memory: string;
  networkInbound: string;
  networkOutbound: string;
  uptime: string;
  currentTasks: string;
}

const ControlPanel = () => {
  const [log, setLog] = useState<string[]>([]);
  const [stats, setStats] = useState<Partial<Stats>>({});
  const [theme, setTheme] = useState("dark");
  const [users, setUsers] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [messageInput, setMessageInput] = useState("");

  useEffect(() => {
    const socket: Socket = io();

    socket.on("log", (data: string) => setLog((prev) => [...prev, data]));
    socket.on("stats", (data: Stats) => setStats(data));
    socket.on("activity", (data: string) => setLog((prev) => [...prev, data]));
    socket.on("userList", (users: string[]) => setUsers(users));
    socket.on("message", (data: string) => setLog((prev) => [...prev, data])); // Add listener for 'message' event
    fetchTheme();
    fetchStats(); // Fetch stats immediately when the component mounts

    return () => {
      socket.off("log");
      socket.off("stats");
      socket.off("activity");
      socket.off("userList");
      socket.off("message");
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
      setLog((prev) => [...prev, "Bot started"]);
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
      setLog((prev) => [...prev, "Bot stopped"]);
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
      setLog((prev) => [...prev, "Server started"]);
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

  return (
    <div className={`min-h-screen flex flex-col items-center justify-center ${theme}`}>
      <div className={`p-8 rounded shadow-md w-full max-w-2xl control-panel`}>
        <h1 className="text-2xl font-bold mb-4 text-center">Bot Control Panel</h1>
        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
        <div className="mb-4 flex space-x-2 justify-center">
          <button
            onClick={startBot}
            className="bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
          >
            Start Bot
          </button>
          <button
            onClick={stopBot}
            className="bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
          >
            Stop Bot
          </button>
          <button
            onClick={startServer}
            className="bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
          >
            Start Server
          </button>
        </div>
        <div className="mb-4">
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
        <button
          onClick={toggleTheme}
          className="bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
        >
          Toggle Theme
        </button>
      </div>
    </div>
  );
};

export default ControlPanel;
