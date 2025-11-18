import { useState, useEffect } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useUser, UserButton } from '@clerk/clerk-react';
import { useClerkSync } from '../../hooks/useClerkSync';
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
} from 'lucide-react';

export function MainLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user: clerkUser } = useUser();
  const { user: dbUser } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  // Sync Clerk user with backend
  useClerkSync();

  // Redirect to onboarding if no role/institution is set
  useEffect(() => {
    console.log('🔍 MainLayout checking user state:', {
      dbUser: dbUser ? { role: dbUser.role, institutionId: dbUser.institutionId } : null,
      pathname: location.pathname
    });

    // Only run this check if we have the DB user loaded
    if (dbUser && !dbUser.role && !location.pathname.includes('/onboarding')) {
      console.log('⚠️ No role found, redirecting to onboarding');
      navigate('/app/onboarding');
    }

    // Optional: Force institution users who haven't selected an institution yet
    if (dbUser?.role === 'institution' && !dbUser?.institutionId && !location.pathname.includes('/onboarding')) {
      console.log('⚠️ Institution user without institutionId, redirecting to onboarding');
      navigate('/app/onboarding');
    }
  }, [dbUser, navigate, location]);

  const navItems = [
    { to: '/app/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/app/institutions', icon: Building2, label: 'Institutions' },
    { to: '/app/curricula', icon: BookOpen, label: 'Curricula' },
    { to: '/app/jobs', icon: Briefcase, label: 'Jobs' },
    { to: '/app/analytics', icon: TrendingUp, label: 'Analytics' },
    { to: '/app/settings', icon: Settings, label: 'Settings' },
  ];

  return (
    <div className="h-screen bg-gray-50 overflow-hidden flex flex-col">
      <nav className="bg-white shadow-sm border-b border-gray-200 flex-shrink-0">
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
              <UserButton
                appearance={{
                  elements: {
                    avatarBox: 'w-8 h-8 sm:w-10 sm:h-10',
                    userButtonPopoverCard: 'shadow-lg border-0',
                    userButtonTrigger: 'focus:shadow-none',
                  }
                }}
                showName={true}
                userProfileMode="modal"
              />
            </div>
          </div>
        </div>
      </nav>

      <div className="flex flex-1 overflow-hidden">
        <aside
          className={`${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          } fixed lg:static lg:translate-x-0 z-30 w-64 h-full bg-white border-r border-gray-200 transition-transform duration-300 ease-in-out overflow-y-auto`}
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

        <main className={`flex-1 h-full overflow-y-auto transition-all duration-300 ${
          sidebarOpen ? 'lg:ml-0' : 'lg:ml-0'
        }`}>
          <div className="p-4 sm:p-6 lg:p-8">
            <Outlet />
          </div>
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