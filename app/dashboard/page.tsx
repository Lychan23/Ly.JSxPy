"use client"
import React, { useState, lazy, Suspense } from 'react';
import { useAuth } from '../context/authContext';
import { ChevronLeft, ChevronRight, LayoutDashboard, Terminal, Code, Brain } from 'lucide-react';

// Lazy load components for better performance
const ControlPanel = lazy(() => import('./control-panel/page'));
const CommandBuilder = lazy(() => import('./command-builder/page'));
const TerminalPage = lazy(() => import('./terminal/page'));
const AIDashboard = lazy(() => import('./ai/page'));

const DashboardPage = () => {
  const authContext = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [activeComponent, setActiveComponent] = useState('ControlPanel');

  if (!authContext?.loggedIn) {
    return <div className="flex items-center justify-center h-screen">Please log in to access the dashboard.</div>;
  }

  const menuItems = [
    { name: 'Control Panel', key: 'ControlPanel', icon: LayoutDashboard },
    { name: 'Command Builder', key: 'CommandBuilder', icon: Code },
    { name: 'Terminal Page', key: 'TerminalPage', icon: Terminal },
    { name: 'AI Dashboard', key: 'AIDashboard', icon: Brain },
  ];

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
      <div
        className={`bg-white dark:bg-gray-800 shadow-lg transition-all duration-300 ease-in-out ${
          isSidebarOpen ? 'w-64' : 'w-20'
        }`}
      >
        <div className="flex justify-between items-center p-4">
          {isSidebarOpen && (
            <h2 className="text-xl font-bold text-gray-800 dark:text-white">Dashboard</h2>
          )}
          <button
            onClick={toggleSidebar}
            className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors duration-200"
          >
            {isSidebarOpen ? <ChevronLeft size={24} /> : <ChevronRight size={24} />}
          </button>
        </div>
        <nav className="mt-6">
          {menuItems.map((item) => (
            <button
              key={item.key}
              onClick={() => setActiveComponent(item.key)}
              className={`w-full flex items-center py-2 px-4 rounded transition-colors duration-200 ${
                activeComponent === item.key
                  ? 'bg-blue-500 text-white'
                  : 'text-gray-600 dark:text-gray-300 hover:bg-blue-100 dark:hover:bg-blue-700'
              }`}
            >
              <item.icon size={24} className="mr-2" />
              {isSidebarOpen && <span>{item.name}</span>}
            </button>
          ))}
        </nav>
      </div>
      <main className="flex-1 p-10 overflow-auto">
        <Suspense fallback={<div className="flex items-center justify-center h-full">Loading...</div>}>
          {activeComponent === 'ControlPanel' && <ControlPanel />}
          {activeComponent === 'CommandBuilder' && <CommandBuilder />}
          {activeComponent === 'TerminalPage' && <TerminalPage />}
          {activeComponent === 'AIDashboard' && <AIDashboard />}
        </Suspense>
      </main>
    </div>
  );
};

export default DashboardPage;