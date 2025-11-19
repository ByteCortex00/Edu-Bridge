// src/pages/Onboarding.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import { useInstitutionsAPI } from '../api/institutions';
import { useAuthAPI } from '../api/auth';
import { useAuthStore } from '../store/authStore';
import { Building2, Save, Plus, Search } from 'lucide-react';

export function Onboarding() {
  const { user: clerkUser } = useUser();
  const navigate = useNavigate();
  const institutionsAPI = useInstitutionsAPI();
  const authAPI = useAuthAPI();
  const setAuth = useAuthStore((state) => state.setAuth);

  const [institutions, setInstitutions] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Mode: 'select' or 'create'
  const [mode, setMode] = useState('select');
  
  // Selection state
  const [institutionId, setInstitutionId] = useState('');
  
  // Creation state
  const [newInst, setNewInst] = useState({
    name: '',
    type: 'university',
    country: '',
    city: '',
    contactEmail: ''
  });

  useEffect(() => {
    loadInstitutions();
  }, []);

  const loadInstitutions = async () => {
    const response = await institutionsAPI.getAll();
    if (response.success) setInstitutions(response.data);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      let targetInstitutionId = institutionId;

      // 1. Create institution if in 'create' mode
      if (mode === 'create') {
        const createRes = await institutionsAPI.create(newInst);
        if (!createRes.success) throw new Error(createRes.message);
        targetInstitutionId = createRes.data._id;
      }

      // 2. Update User Profile
      const response = await authAPI.updateProfile({
        role: 'institution',
        institutionId: targetInstitutionId
      });

      if (response.success) {
        setAuth(response.data, null);
        // Reload Clerk user to sync metadata if needed
        await clerkUser.reload();
        navigate('/app/dashboard');
      } else {
        alert(`Failed: ${response.message}`);
      }
    } catch (error) {
      console.error(error);
      alert('An error occurred during setup.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Welcome, {clerkUser?.firstName}</h1>
          <p className="text-gray-600">Let's set up your institution access</p>
        </div>

        {/* Toggle Switch */}
        <div className="flex bg-gray-100 p-1 rounded-lg mb-6">
          <button
            type="button"
            onClick={() => setMode('select')}
            className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
              mode === 'select' ? 'bg-white shadow text-blue-600' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Select Existing
          </button>
          <button
            type="button"
            onClick={() => setMode('create')}
            className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
              mode === 'create' ? 'bg-white shadow text-blue-600' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Create New
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="p-4 border border-blue-100 bg-blue-50 rounded-lg flex items-center mb-4">
            <Building2 className="w-5 h-5 text-blue-600 mr-3" />
            <span className="text-sm text-blue-800">Role: Institution Administrator</span>
          </div>

          {mode === 'select' ? (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Select Institution</label>
              <div className="relative">
                <Search className="absolute left-3 top-2.5 text-gray-400 w-4 h-4" />
                <select
                  value={institutionId}
                  onChange={(e) => setInstitutionId(e.target.value)}
                  required={mode === 'select'}
                  className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">-- Choose --</option>
                  {institutions.map((inst) => (
                    <option key={inst._id} value={inst._id}>{inst.name}</option>
                  ))}
                </select>
              </div>
            </div>
          ) : (
            <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <input
                placeholder="Institution Name"
                required={mode === 'create'}
                value={newInst.name}
                onChange={e => setNewInst({...newInst, name: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
              <select
                value={newInst.type}
                onChange={e => setNewInst({...newInst, type: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="university">University</option>
                <option value="college">College</option>
                <option value="technical">Technical Institute</option>
              </select>
              <input
                placeholder="Country"
                required={mode === 'create'}
                value={newInst.country}
                onChange={e => setNewInst({...newInst, country: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
              <input
                placeholder="City"
                required={mode === 'create'}
                value={newInst.city}
                onChange={e => setNewInst({...newInst, city: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
              <input
                type="email"
                placeholder="Contact Email"
                required={mode === 'create'}
                value={newInst.contactEmail}
                onChange={e => setNewInst({...newInst, contactEmail: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
          )}

          <button
            type="submit"
            disabled={loading || (mode === 'select' && !institutionId)}
            className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 mt-6"
          >
            {loading ? 'Processing...' : (
              <>
                <Save className="w-4 h-4 mr-2" />
                {mode === 'create' ? 'Create & Join' : 'Join Institution'}
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}