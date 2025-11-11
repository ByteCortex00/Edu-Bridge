import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../../api/auth';
import { institutionsAPI } from '../../api/institutions';
import { useAuthStore } from '../../store/authStore';
import { UserPlus } from 'lucide-react';

export function RegisterForm() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'viewer', // Default to viewer
    institutionId: '', 
  });
  const [institutions, setInstitutions] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingInstitutions, setLoadingInstitutions] = useState(true);
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);

  // Load institutions on component mount
  useEffect(() => {
    const loadInstitutions = async () => {
      try {
        const response = await institutionsAPI.getAll();
        if (response.success && response.data.length > 0) {
          setInstitutions(response.data);
        }
      } catch (err) {
        console.error('Failed to load institutions:', err);
      } finally {
        setLoadingInstitutions(false);
      }
    };
    loadInstitutions();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    console.log('📝 Frontend: Starting registration for:', formData.email);

    if (formData.password !== formData.confirmPassword) {
      console.log('❌ Frontend: Passwords do not match');
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      console.log('❌ Frontend: Password too short');
      setError('Password must be at least 6 characters');
      return;
    }

    // Conditional validation: Institution ID is REQUIRED for 'institution' role
    if (formData.role === 'institution' && !formData.institutionId) {
      console.log('❌ Frontend: Institution required for institution role');
      setError('Please select an institution to register with this role.');
      return;
    }

    setLoading(true);

    try {
      const payload = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role: formData.role,
        // Only send institutionId if the role is 'institution'
        institutionId: formData.role === 'institution' ? formData.institutionId : undefined,
      };
      console.log('📤 Frontend: Sending registration payload:', payload);

      const response = await authAPI.register(payload);
      console.log('📥 Frontend: Registration response:', response);

      if (response.success) {
        console.log('✅ Frontend: Registration successful, auto-logging in and navigating to /dashboard');
        // Auto-login after registration
        setAuth(response.data.user, response.data.token);
        // FIX: Add the delay here as well to prevent the registration redirect loop
        await new Promise(resolve => setTimeout(resolve, 50));
        navigate('/dashboard');
      } else {
        console.log('❌ Frontend: Registration failed:', response.message);
        // This catches custom error messages returned by the backend (e.g., email already exists)
        setError(response.message || 'Registration failed');
      }
    } catch (err) {
      console.log('❌ Frontend: Registration error:', err.message);
      // This catches 400 Bad Request if validation fails on the server
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { id, value } = e.target;
    let newState = { ...formData, [id]: value };

    // Reset institutionId if role is switched to 'viewer'
    if (id === 'role' && value === 'viewer') {
      newState.institutionId = '';
    }
    
    // Set formData state
    setFormData(newState);
  };

  if (loadingInstitutions) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-green-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }
  
  const isInstitutionRole = formData.role === 'institution';

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-green-50">
      <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md mx-4 sm:mx-0">
        <div className="flex items-center justify-center mb-6">
          <UserPlus className="w-12 h-12 text-blue-600" />
        </div>
        <h2 className="text-2xl font-bold text-center mb-6 text-gray-800">
          Register for the Platform
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}
          
          {/* Name Field */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Full Name
            </label>
            <input
              id="name"
              type="text"
              value={formData.name}
              onChange={handleInputChange}
              required
              autoComplete="name" 
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="John Doe"
            />
          </div>
          
          {/* Email Field */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={formData.email}
              onChange={handleInputChange}
              required
              autoComplete="email" 
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="user@example.com"
            />
          </div>

          {/* Password Field */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={formData.password}
              onChange={handleInputChange}
              required
              autoComplete="new-password"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="••••••••"
            />
          </div>

          {/* Confirm Password Field */}
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
              Confirm Password
            </label>
            <input
              id="confirmPassword"
              type="password"
              value={formData.confirmPassword}
              onChange={handleInputChange}
              required
              autoComplete="new-password"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="••••••••"
            />
          </div>
          
          {/* Role Select Field */}
          <div>
            <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
              Select Role
            </label>
            <select
              id="role"
              value={formData.role}
              onChange={handleInputChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="viewer">Viewer (General Access)</option>
              <option value="institution">Institution User (Curriculum Management)</option>
            </select>
          </div>

          {/* Institution Select Field (CONDITIONAL) */}
          {isInstitutionRole && (
            <div>
              <label htmlFor="institutionId" className="block text-sm font-medium text-gray-700 mb-1">
                Link Institution
              </label>
              <select
                id="institutionId"
                value={formData.institutionId}
                onChange={handleInputChange}
                required={isInstitutionRole}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {institutions.length === 0 ? (
                  <option value="">No Institutions Found</option>
                ) : (
                  <>
                    <option value="">-- Select your Institution --</option>
                    {institutions.map(inst => (
                      <option key={inst._id} value={inst._id}>
                        {inst.name}
                      </option>
                    ))}
                  </>
                )}
              </select>
              {institutions.length === 0 && (
                <p className="text-xs text-red-500 mt-1">Cannot register as Institution User without institutions.</p>
              )}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || (isInstitutionRole && institutions.length === 0)}
            className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Registering...' : 'Register'}
          </button>
        </form>

        <div className="mt-4 text-center text-sm text-gray-600">
          Already have an account?{' '}
          <a href="/login" className="text-blue-600 hover:underline">
            Sign In
          </a>
        </div>
      </div>
    </div>
  );
}