import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import { useInstitutionsAPI } from '../api/institutions';
import { useAuthAPI } from '../api/auth';
import { useAuthStore } from '../store/authStore';
import { Building2, Shield, Save } from 'lucide-react';

export function Onboarding() {
  const { user: clerkUser } = useUser();
  const navigate = useNavigate();
  const institutionsAPI = useInstitutionsAPI();
  const authAPI = useAuthAPI();
  const setAuth = useAuthStore((state) => state.setAuth);

  const [institutions, setInstitutions] = useState([]);
  const [role, setRole] = useState('institution'); // Only institution role for this flow
  const [institutionId, setInstitutionId] = useState('');
  const [loading, setLoading] = useState(false);

  // 1. Load Institutions
  useEffect(() => {
    const loadData = async () => {
      const response = await institutionsAPI.getAll();
      if (response.success) {
        setInstitutions(response.data);
      }
    };
    loadData();
  }, []);

  // 2. Handle Form Submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    console.log('🚀 Starting onboarding submission...');
    console.log('📝 Data to send:', { role, institutionId });

    try {
      // Update profile in your backend
      const response = await authAPI.updateProfile({
        role,
        institutionId: role === 'institution' ? institutionId : null
      });

      console.log('📥 API Response:', response);

      if (response.success) {
        console.log('✅ Profile updated successfully:', response.data);
        console.log('🔄 About to update auth store...');

        // Update local store
        // Note: We pass null for token as Clerk handles the token,
        // but we update the user object with the new role/institution
        setAuth(response.data, null);

        console.log('🔄 Auth store updated, navigating to dashboard...');

        // Small delay to ensure state updates
        setTimeout(() => {
          console.log('🚀 Executing navigation to /app/dashboard');
          navigate('/app/dashboard');
        }, 100);

      } else {
        console.error('❌ API returned success=false:', response);
        alert(`Failed to update profile: ${response.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('❌ Onboarding failed with exception:', error);
      alert(`Failed to update profile: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Complete Your Profile</h1>
          <p className="text-gray-600 mt-2">
            Welcome, {clerkUser?.firstName}! Please finish setting up your account.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Role Selection (Institution Only) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Account Type
            </label>
            <div className="p-4 border border-blue-600 bg-blue-50 rounded-lg flex flex-col items-center justify-center">
              <Building2 className="w-6 h-6 mb-2 text-blue-700" />
              <span className="text-sm font-medium text-blue-700">Institution</span>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              All users are registered as institutions. Contact admin for special access.
            </p>
          </div>

          {/* Institution Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Your Institution
            </label>
            <select
              value={institutionId}
              onChange={(e) => setInstitutionId(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">-- Select Institution --</option>
              {institutions.map((inst) => (
                <option key={inst._id} value={inst._id}>
                  {inst.name}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-2">
              Don't see your institution? Contact support for assistance.
            </p>
          </div>

          <button
            type="submit"
            disabled={loading || !institutionId}
            className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? (
              <span className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></span>
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            Complete Setup
          </button>
        </form>
      </div>
    </div>
  );
}