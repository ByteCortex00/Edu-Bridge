import { Outlet, Link, useLocation } from 'react-router-dom';
import { UserButton, useUser } from '@clerk/clerk-react';
import { useClerkSync } from '../../hooks/useClerkSync';
import { useState } from 'react';
import {
  LayoutDashboard,
  Building2,
  BookOpen,
  Briefcase,
  TrendingUp,
  Settings,
  Menu,
  X
} from 'lucide-react';

export function MainLayout() {
  const location = useLocation();
  const { user } = useUser(); // Get Clerk user data for the sidebar display
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  useClerkSync();

  const navItems = [
    { to: '/app/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/app/institutions', icon: Building2, label: 'Institutions' },
    { to: '/app/curricula', icon: BookOpen, label: 'Curricula' },
    { to: '/app/jobs', icon: Briefcase, label: 'Market' },
    { to: '/app/analytics', icon: TrendingUp, label: 'Analytics' },
  ];

  const isActive = (path) => location.pathname.startsWith(path);

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans text-slate-900">
      
      {/* ================= DESKTOP SIDEBAR ================= */}
      <aside className="hidden md:flex w-64 flex-col bg-slate-900 text-white shadow-xl z-30 flex-shrink-0 transition-all duration-300">
        <div className="flex items-center h-16 px-6 border-b border-slate-800">
          <TrendingUp className="w-6 h-6 text-blue-500 mr-2" />
          <span className="text-lg font-bold tracking-tight">EduBridge</span>
        </div>

        <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={`flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 group ${
                isActive(item.to)
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-900/20'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <item.icon className={`w-5 h-5 mr-3 flex-shrink-0 ${isActive(item.to) ? 'text-white' : 'text-slate-500 group-hover:text-white'}`} />
              {item.label}
            </Link>
          ))}
        </nav>

        {/* ✅ NEW: Clerk User Profile Section */}
        <div className="p-4 border-t border-slate-800">
          {/* App Settings Link */}
          <Link 
            to="/app/settings" 
            className="flex items-center px-3 py-2 mb-2 text-sm font-medium text-slate-400 rounded-lg hover:bg-slate-800 hover:text-white transition-colors"
          >
            <Settings className="w-5 h-5 mr-3" />
            Global Settings
          </Link>
          
          {/* Clerk User Button & Info */}
          <div className="flex items-center gap-3 px-3 py-3 rounded-xl bg-slate-800/50 hover:bg-slate-800 transition-all duration-200 border border-slate-700/50">
            <div className="flex-shrink-0">
              <UserButton 
                afterSignOutUrl="/sign-in"
                appearance={{
                  elements: {
                    avatarBox: "w-9 h-9 border-2 border-slate-600 hover:border-blue-500 transition-colors",
                    userButtonPopoverCard: "shadow-xl",
                    userButtonTrigger: "focus:shadow-none focus:outline-none"
                  }
                }}
              />
            </div>
            <div className="flex flex-col min-w-0 overflow-hidden">
              <span className="text-sm font-semibold text-white truncate">
                {user?.fullName || user?.firstName || 'User'}
              </span>
              <span className="text-[10px] text-slate-400 truncate">
                {user?.primaryEmailAddress?.emailAddress}
              </span>
            </div>
          </div>
        </div>
      </aside>

      {/* ================= MAIN AREA ================= */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        
        {/* Mobile Header */}
        <header className="md:hidden bg-white border-b border-slate-200 h-16 flex items-center justify-between px-4 sticky top-0 z-20">
          <div className="flex items-center">
            <TrendingUp className="w-6 h-6 text-blue-600 mr-2" />
            <span className="font-bold text-slate-900 text-lg">EduBridge</span>
          </div>
          <div className="flex items-center gap-4">
            {/* Mobile User Button */}
            <UserButton afterSignOutUrl="/sign-in" appearance={{ elements: { avatarBox: "w-8 h-8" } }} />
            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </header>

        {/* Mobile Menu Overlay */}
        {mobileMenuOpen && (
          <div className="md:hidden absolute top-16 left-0 right-0 bg-white border-b border-slate-200 z-40 shadow-lg animate-in slide-in-from-top-2">
            <nav className="p-4 space-y-2">
              {navItems.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center px-4 py-3 rounded-lg text-sm font-medium ${
                    isActive(item.to) ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <item.icon className="w-5 h-5 mr-3" />
                  {item.label}
                </Link>
              ))}
              <Link
                  to="/app/settings"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center px-4 py-3 rounded-lg text-sm font-medium ${
                    isActive('/app/settings') ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Settings className="w-5 h-5 mr-3" />
                  Settings
                </Link>
            </nav>
          </div>
        )}

        {/* Content Wrapper */}
        <main className="flex-1 h-full overflow-hidden relative">
          <Outlet />
        </main>
      </div>
    </div>
  );
}