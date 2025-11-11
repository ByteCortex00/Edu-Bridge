import { Settings as SettingsIcon } from 'lucide-react';

export function Settings() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600 mt-1">Manage your account and preferences</p>
      </div>

      <div className="text-center py-20">
        <SettingsIcon className="w-20 h-20 text-gray-400 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 mb-2">Settings Panel</h3>
        <p className="text-gray-600 max-w-md mx-auto">Coming soon</p>
      </div>
    </div>
  );
}
