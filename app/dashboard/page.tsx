"use client";
import React, { useState, lazy, Suspense, useEffect } from 'react';
import { useAuth } from '../context/authContext';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import { motion, AnimatePresence } from 'framer-motion';
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
  LogOut,
  LucideIcon
} from 'lucide-react';

// Types and Interfaces
interface Notification {
  id: number;
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
}

interface MenuItem {
  name: string;
  key: string;
  icon: LucideIcon;
  requiredRole?: string[];
}

// Animation variants
const sidebarVariants = {
  open: {
    width: "240px",
    transition: {
      type: "spring",
      damping: 20,
    },
  },
  closed: {
    width: "80px",
    transition: {
      type: "spring",
      damping: 20,
    },
  },
};

const contentVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 }
};

// Lazy load components

const CommandBuilder = lazy(() => import('./command-builder/page'));
const TerminalPage = lazy(() => import('./terminal/page'));
const AIDashboard = lazy(() => import('./ai/page'));

// Component definitions
const SearchBar = () => {
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <div className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search..."
          className="pl-10 pr-4 py-2 w-64 rounded-lg border border-slate-200 dark:border-slate-700 
            bg-slate-50 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 
            dark:focus:ring-indigo-400 text-sm"
        />
      </div>
    </div>
  );
};

const NotificationPanel = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 
          transition-colors duration-200 relative"
      >
        <Bell className="w-5 h-5 text-slate-600 dark:text-slate-300" />
        {notifications.length > 0 && (
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
        )}
      </button>
      
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-800 
              rounded-lg shadow-lg border border-slate-200 dark:border-slate-700"
          >
            <div className="p-4">
              <h3 className="text-sm font-medium text-slate-900 dark:text-slate-100">
                Notifications
              </h3>
              {notifications.length === 0 ? (
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                  No new notifications
                </p>
              ) : (
                <div className="mt-2 space-y-2">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className="p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700"
                    >
                      <h4 className="text-sm font-medium text-slate-900 dark:text-slate-100">
                        {notification.title}
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {notification.message}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const LoadingSpinner = () => (
  <div className="flex items-center justify-center h-full">
    <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
  </div>
);

// Main Dashboard Component
const DashboardPage = () => {
  const { user, loggedIn, logout, loading } = useAuth();
  const router = useRouter();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [activeComponent, setActiveComponent] = useState('ControlPanel');
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    if (!loading && !loggedIn) {
      router.push('/auth');
    }
  }, [loading, loggedIn, router]);

  // Show loading state while checking auth
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  // If not logged in, don't render the dashboard
  if (!loggedIn || !user) {
    return null;
  }


  const menuItems: MenuItem[] = [
    { name: 'Control Panel', key: 'ControlPanel', icon: LayoutDashboard },
    { name: 'Command Builder', key: 'CommandBuilder', icon: Code, requiredRole: ['admin', 'developer'] },
    { name: 'Terminal Page', key: 'TerminalPage', icon: Terminal, requiredRole: ['admin'] },
    { name: 'AI Dashboard', key: 'AIDashboard', icon: Brain },
  ];

  const UserProfile = () => (
    <div className="relative group">
      <button className="flex items-center space-x-2 p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700">
        <User className="w-5 h-5 text-slate-600 dark:text-slate-300" />
        {isSidebarOpen && (
          <span className="text-sm text-slate-600 dark:text-slate-300">
            {user?.username || 'User'}
          </span>
        )}
      </button>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        whileHover={{ opacity: 1, y: 0 }}
        className="absolute bottom-full left-0 mb-2 w-48"
      >
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-4">
          <div className="mb-3">
            <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
              {user?.username}
            </h4>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              {user?.email}
            </p>
          </div>
          <button
            onClick={logout}
            className="w-full flex items-center space-x-2 p-2 text-red-500 hover:bg-red-50 
              dark:hover:bg-red-900/20 rounded-lg transition-colors duration-200"
          >
            <LogOut size={16} />
            <span className="text-sm">Logout</span>
          </button>
        </div>
      </motion.div>
    </div>
  );

  const hasRequiredRole = (requiredRole?: string[]): boolean => {
    if (!requiredRole) return true;
    return requiredRole.some(role => user?.roles?.includes(role));
  };

  const filteredMenuItems = menuItems.filter(item => hasRequiredRole(item.requiredRole));

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-900 overflow-hidden">
      <motion.div
        variants={sidebarVariants}
        initial={false}
        animate={isSidebarOpen ? 'open' : 'closed'}
        className="bg-white dark:bg-slate-800 shadow-lg relative"
      >
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="absolute -right-3 top-6 bg-white dark:bg-slate-800 rounded-full p-1 
            shadow-md border border-slate-200 dark:border-slate-700"
        >
          {isSidebarOpen ? (
            <ChevronLeft className="w-4 h-4 text-slate-600 dark:text-slate-300" />
          ) : (
            <ChevronRight className="w-4 h-4 text-slate-600 dark:text-slate-300" />
          )}
        </button>

        <div className="p-4">
          <h1 className={`font-bold text-slate-800 dark:text-slate-200 
            ${isSidebarOpen ? 'text-xl' : 'text-center text-2xl'}`}>
            {isSidebarOpen ? 'Dashboard' : 'D'}
          </h1>
        </div>

        <nav className="mt-6 px-2">
          {filteredMenuItems.map((item) => (
            <motion.button
              key={item.key}
              onClick={() => setActiveComponent(item.key)}
              whileHover={{ scale: 1.02 }}
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
                    className="text-sm"
                  >
                    {item.name}
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>
          ))}
        </nav>

        <div className="absolute bottom-0 w-full p-4 border-t border-slate-200 dark:border-slate-700">
          <UserProfile />
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="w-full mt-2 p-2 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-300 
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
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="h-full"
            >              
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