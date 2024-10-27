"use client"
import React, { useState, lazy, Suspense, useEffect } from 'react';
import { useAuth } from '../context/authContext';
import { useRouter } from 'next/navigation';
import { 
  ChevronLeft, 
  ChevronRight, 
  LayoutDashboard, 
  Terminal, 
  Code, 
  Brain, 
  Loader2,
  Bell,
  Search,
  Settings,
  User,
  LucideIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from 'next-themes';

// Define interfaces
interface Notification {
  id: number;
  title: string;
  message: string;
}

interface MenuItem {
  name: string;
  key: string;
  icon: LucideIcon;  // Updated to use LucideIcon type
}

// Lazy load components
const ControlPanel = lazy(() => import('./control-panel/page'));
const CommandBuilder = lazy(() => import('./command-builder/page'));
const TerminalPage = lazy(() => import('./terminal/page'));
const AIDashboard = lazy(() => import('./ai/page'));

const DashboardPage = () => {
  const authContext = useAuth();
  const router = useRouter();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [activeComponent, setActiveComponent] = useState('ControlPanel');
  const [searchQuery, setSearchQuery] = useState('');
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const { theme, setTheme } = useTheme();

  // Animation variants
  const sidebarVariants = {
    open: { width: '16rem', transition: { duration: 0.4, ease: [0.4, 0, 0.2, 1] } },
    closed: { width: '5rem', transition: { duration: 0.4, ease: [0.4, 0, 0.2, 1] } }
  };

  const contentVariants = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
    exit: { opacity: 0, y: -20, transition: { duration: 0.3 } }
  };

  const menuItems: MenuItem[] = [
    { name: 'Control Panel', key: 'ControlPanel', icon: LayoutDashboard },
    { name: 'Command Builder', key: 'CommandBuilder', icon: Code },
    { name: 'Terminal Page', key: 'TerminalPage', icon: Terminal },
    { name: 'AI Dashboard', key: 'AIDashboard', icon: Brain },
  ];

  // Mock notifications - replace with real notifications system
  useEffect(() => {
    const mockNotifications: Notification[] = [
      { id: 1, title: 'System Update', message: 'New features available' },
      { id: 2, title: 'Security Alert', message: 'Please review recent activity' }
    ];
    setNotifications(mockNotifications);
  }, []);

  if (!authContext?.loggedIn) {
    return (
      <motion.div 
        className="flex items-center justify-center h-screen bg-slate-50 dark:bg-slate-900"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="p-8 bg-white dark:bg-slate-800 rounded-xl shadow-lg"
        >
          <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100 mb-4">
            Authentication Required
          </h2>
          <p className="text-slate-600 dark:text-slate-300">
            Please log in to access the dashboard.
          </p>
        </motion.div>
      </motion.div>
    );
  }

  const LoadingSpinner = () => (
    <div className="flex items-center justify-center h-full">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="flex flex-col items-center gap-4"
      >
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600 dark:text-indigo-400" />
        <p className="text-sm text-slate-600 dark:text-slate-400">Loading content...</p>
      </motion.div>
    </div>
  );

  const SearchBar = () => (
    <motion.div 
      initial={false}
      animate={isSearchOpen ? { width: "300px" } : { width: "40px" }}
      transition={{ duration: 0.3 }}
      className="relative"
    >
      <input
        type="text"
        placeholder="Search..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className={`w-full px-4 py-2 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200 
          focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-300
          ${isSearchOpen ? 'opacity-100' : 'opacity-0'}`}
      />
      <button
        onClick={() => setIsSearchOpen(!isSearchOpen)}
        className="absolute right-2 top-1/2 transform -translate-y-1/2"
      >
        <Search className="w-5 h-5 text-slate-500 dark:text-slate-400" />
      </button>
    </motion.div>
  );

  const NotificationPanel = () => (
    <div className="relative group">
      <button className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors duration-200">
        <Bell className="w-5 h-5 text-slate-600 dark:text-slate-300" />
        {notifications.length > 0 && (
          <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full" />
        )}
      </button>
      <div className="absolute right-0 mt-2 w-64 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-4">
          {notifications.map((notification: Notification) => (
            <div key={notification.id} className="mb-3 last:mb-0">
              <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                {notification.title}
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                {notification.message}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-900 overflow-hidden">
      <motion.div
        variants={sidebarVariants}
        initial={false}
        animate={isSidebarOpen ? 'open' : 'closed'}
        className="bg-white dark:bg-slate-800 shadow-lg relative"
      >
        <div className="sticky top-0 bg-white dark:bg-slate-800 z-10 border-b border-slate-200 dark:border-slate-700">
          <div className="flex justify-between items-center p-4">
            <AnimatePresence mode="wait">
              {isSidebarOpen && (
                <motion.h2
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className="text-xl font-semibold text-slate-800 dark:text-slate-100"
                >
                  Dashboard
                </motion.h2>
              )}
            </AnimatePresence>
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors duration-200"
              aria-label={isSidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
            >
              <motion.div animate={{ rotate: isSidebarOpen ? 0 : 180 }}>
                {isSidebarOpen ? <ChevronLeft /> : <ChevronRight />}
              </motion.div>
            </button>
          </div>
        </div>

        <nav className="mt-6 px-2">
          {menuItems.map((item) => (
            <motion.button
              key={item.key}
              onClick={() => setActiveComponent(item.key)}
              whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
              whileTap={{ scale: 0.98 }}
              className={`w-full flex items-center py-3 px-4 rounded-lg mb-2 transition-all duration-200
                ${activeComponent === item.key
                  ? 'bg-indigo-500 text-white shadow-md'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-slate-700'
                }`}
            >
              <item.icon size={20} className={`${!isSidebarOpen ? 'mx-auto' : 'mr-3'}`} />
              <AnimatePresence mode="wait">
                {isSidebarOpen && (
                  <motion.span
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ duration: 0.3 }}
                  >
                    {item.name}
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>
          ))}
        </nav>

        <div className="absolute bottom-0 w-full p-4 border-t border-slate-200 dark:border-slate-700">
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="w-full p-2 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-300 
              hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors duration-200"
          >
            {theme === 'dark' ? '🌞 Light' : '🌙 Dark'}
          </button>
        </div>
      </motion.div>

      <div className="flex-1 flex flex-col">
        <header className="bg-white dark:bg-slate-800 shadow-sm">
          <div className="flex items-center justify-between px-6 py-4">
            <SearchBar />
            <div className="flex items-center space-x-4">
              <NotificationPanel />
              <button 
                onClick={() => router.push('/dashboard/settings')}
                className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors duration-200"
              >
                <Settings className="w-5 h-5 text-slate-600 dark:text-slate-300" />
              </button>
              <button 
                onClick={() => router.push('/dashboard/profile')}
                className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors duration-200"
              >
                <User className="w-5 h-5 text-slate-600 dark:text-slate-300" />
              </button>
            </div>
          </div>
        </header>

        <motion.main
          className="flex-1 p-6 overflow-auto"
          variants={contentVariants}
          initial="initial"
          animate="animate"
          exit="exit"
        >
          <Suspense fallback={<LoadingSpinner />}>
            <motion.div
              key={activeComponent}
              variants={contentVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="h-full"
            >
              {activeComponent === 'ControlPanel' && <ControlPanel />}
              {activeComponent === 'CommandBuilder' && <CommandBuilder />}
              {activeComponent === 'TerminalPage' && <TerminalPage />}
              {activeComponent === 'AIDashboard' && <AIDashboard />}
            </motion.div>
          </Suspense>
        </motion.main>
      </div>
    </div>
  );
};

export default DashboardPage;