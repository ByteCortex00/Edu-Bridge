import { Settings as SettingsIcon, Shield, Bell, Lock } from 'lucide-react';
import { PageLayout } from '../components/layout/PageLayout';

export function Settings() {
  return (
    <PageLayout
      title="Settings"
      description="Manage your application preferences and configurations"
    >
      {/* Main Settings Container */}
      <div className="max-w-2xl mx-auto space-y-6">
        
        {/* Placeholder Card */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-8 text-center">
          <div className="bg-slate-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
            <SettingsIcon className="w-10 h-10 text-slate-400" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-2">Settings Panel</h3>
          <p className="text-slate-500 max-w-md mx-auto mb-8">
            Global application configurations will appear here. You can currently manage your personal details in the User Profile menu.
          </p>

          {/* Dummy Options to visualize layout */}
          <div className="grid gap-4 text-left opacity-50 pointer-events-none select-none">
            <div className="flex items-center justify-between p-4 border border-slate-100 rounded-lg">
              <div className="flex items-center">
                <Bell className="w-5 h-5 text-slate-400 mr-3" />
                <div>
                  <p className="font-medium text-slate-900">Notifications</p>
                  <p className="text-xs text-slate-500">Email and push alerts</p>
                </div>
              </div>
              <div className="w-10 h-5 bg-slate-200 rounded-full"></div>
            </div>
            <div className="flex items-center justify-between p-4 border border-slate-100 rounded-lg">
              <div className="flex items-center">
                <Shield className="w-5 h-5 text-slate-400 mr-3" />
                <div>
                  <p className="font-medium text-slate-900">Privacy Mode</p>
                  <p className="text-xs text-slate-500">Hide profile from public search</p>
                </div>
              </div>
              <div className="w-10 h-5 bg-slate-200 rounded-full"></div>
            </div>
          </div>
        </div>

      </div>
    </PageLayout>
  );
}