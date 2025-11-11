import { useState } from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import {
  Menu,
  X,
  LayoutDashboard,
  Building2,
  BookOpen,
  Briefcase,
  TrendingUp,
  Settings,
  LogOut,
} from 'lucide-react';

export function MainLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, clearAuth } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    clearAuth();
    navigate('/login');
  };

  const navItems = [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/institutions', icon: Building2, label: 'Institutions' },
    { to: '/curricula', icon: BookOpen, label: 'Curricula' },
    { to: '/jobs', icon: Briefcase, label: 'Jobs' },
    { to: '/analytics', icon: TrendingUp, label: 'Analytics' },
    { to: '/settings', icon: Settings, label: 'Settings' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 lg:hidden"
              >
                {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
              <TrendingUp className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600 ml-2" />
              <span className="ml-2 text-lg sm:text-xl font-bold text-gray-900">
                Skills Gap Analysis
              </span>
            </div>

            <div className="flex items-center space-x-4">
              <div className="text-sm hidden sm:block">
                <div className="font-medium text-gray-900">{user?.name}</div>
                <div className="text-gray-500 capitalize">{user?.role}</div>
              </div>
              <button
                onClick={handleLogout}
                className="p-2 rounded-md text-gray-600 hover:text-red-600 hover:bg-red-50"
                title="Logout"
              >
                <LogOut className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="flex">
        <aside
          className={`${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          } fixed lg:static lg:translate-x-0 z-30 w-64 h-[calc(100vh-4rem)] bg-white border-r border-gray-200 transition-transform duration-300 ease-in-out`}
        >
          <nav className="p-4 space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setSidebarOpen(false)}
                className="flex items-center px-4 py-3 text-gray-700 rounded-lg hover:bg-blue-50 hover:text-blue-700 transition-colors text-sm"
              >
                <item.icon className="w-4 h-4 sm:w-5 sm:h-5 mr-3" />
                {item.label}
              </Link>
            ))}
          </nav>
        </aside>

        <main className={`flex-1 p-4 sm:p-6 lg:p-8 overflow-auto transition-all duration-300 ${
          sidebarOpen ? 'lg:ml-0' : 'lg:ml-0'
        }`}>
          <Outlet />
        </main>
      </div>

      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}