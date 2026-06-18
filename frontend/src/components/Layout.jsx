import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAppStore } from '../store/useAppStore';
import {
  Dumbbell, Utensils, Brain, MessageCircle,
  BarChart2, MapPin, Cpu, LayoutDashboard, LogOut, Bell, Sun, Moon
} from 'lucide-react';

const navItems = [
  { path: '/',            icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/trainer',     icon: Dumbbell,        label: 'AI Trainer' },
  { path: '/diet',        icon: Utensils,        label: 'Dietician' },
  { path: '/habits',      icon: Brain,           label: 'Habits' },
  { path: '/buddy',       icon: MessageCircle,   label: 'Gym Buddy' },
  { path: '/performance', icon: BarChart2,       label: 'Performance' },
  { path: '/recommend',   icon: MapPin,          label: 'Discover' },
  { path: '/iot',         icon: Cpu,             label: 'Smart Gym' },
];

export default function Layout() {
  const { user, logout, notifications, streak, theme, setTheme } = useAppStore();
  const navigate = useNavigate();
  const isDark = theme === 'dark';

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className={`flex h-screen overflow-hidden transition-colors duration-300 ${
      isDark ? 'bg-gray-950 text-white' : 'bg-gray-100 text-gray-900'
    }`}>
      {/* Sidebar */}
      <aside className={`w-64 flex flex-col border-r ${
        isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'
      }`}>
        {/* Logo */}
        <div className={`p-6 border-b ${isDark ? 'border-gray-800' : 'border-gray-200'}`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center">
              <Dumbbell size={20} className="text-white" />
            </div>
            <div>
              <h1 className="font-bold">GymGenie</h1>
              <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Fitness Assistant</p>
            </div>
          </div>
        </div>

        {/* User streak badge */}
        {streak > 0 && (
          <div className="mx-4 mt-4 px-3 py-2 bg-orange-500/10 border border-orange-500/20 rounded-lg">
            <p className="text-xs text-orange-400 font-medium">🔥 {streak}-day streak</p>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map(({ path, icon: Icon, label }) => (
            <NavLink
              key={path}
              to={path}
              end={path === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                  isActive
                    ? 'bg-indigo-600 text-white'
                    : isDark
                      ? 'text-gray-400 hover:bg-gray-800 hover:text-white'
                      : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'
                }`
              }
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* User + logout */}
        <div className={`p-4 border-t ${isDark ? 'border-gray-800' : 'border-gray-200'}`}>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 bg-indigo-500 rounded-full flex items-center justify-center text-sm font-bold text-white">
              {user?.name?.[0]?.toUpperCase() || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user?.name || 'User'}</p>
              <p className={`text-xs truncate ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{user?.email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
          >
            <LogOut size={16} />
            Sign out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        {/* Top bar */}
        <header className={`sticky top-0 z-10 backdrop-blur border-b px-6 py-4 flex items-center justify-between ${
          isDark
            ? 'bg-gray-950/80 border-gray-800'
            : 'bg-gray-100/80 border-gray-200'
        }`}>
          <h2 className="text-lg font-semibold">
            Welcome back, {user?.name?.split(' ')[0] || 'Athlete'}
          </h2>
          <div className="flex items-center gap-2">
            {/* Theme toggle */}
            <button
              onClick={() => setTheme(isDark ? 'light' : 'dark')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                isDark
                  ? 'bg-gray-800 border-gray-700 text-gray-300 hover:border-indigo-500 hover:text-white'
                  : 'bg-white border-gray-300 text-gray-600 hover:border-indigo-400 hover:text-gray-900'
              }`}
            >
              {isDark ? <Sun size={14} /> : <Moon size={14} />}
              {isDark ? 'Light' : 'Dark'}
            </button>

            {/* Notifications */}
            <button className={`relative p-2 rounded-lg transition-colors ${
              isDark ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-900'
            }`}>
              <Bell size={20} />
              {notifications.length > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
              )}
            </button>
          </div>
        </header>

        <div className="p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}