import { useEffect, useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { institutionsAPI } from '../api/institutions';
import { Building2, Plus, Search, Edit, Trash2 } from 'lucide-react';

export function Institutions() {
  const { user } = useAuthStore();
  const [institutions, setInstitutions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingInstitution, setEditingInstitution] = useState(null);

  useEffect(() => {
    loadInstitutions();
  }, []);

  const loadInstitutions = async () => {
    try {
      const response = await institutionsAPI.getAll();
      if (response.success) {
        setInstitutions(response.data);
      }
    } catch (error) {
      console.error('Error loading institutions:', error);
      alert('Failed to load institutions');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this institution?')) return;

    try {
      const response = await institutionsAPI.delete(id);
      if (response.success) {
        loadInstitutions();
      }
    } catch (error) {
      console.error('Error deleting institution:', error);
      alert(error.message || 'Failed to delete institution');
    }
  };

  const filteredInstitutions = institutions.filter((inst) =>
    inst.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    inst.location?.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
    inst.location?.country.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const canEdit = user?.role === 'admin';

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Institutions</h1>
          <p className="text-gray-600 mt-1">Manage educational institutions</p>
        </div>
        {canEdit && (
          <button
            onClick={() => {
              setEditingInstitution(null);
              setShowModal(true);
            }}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5 mr-2" />
            Add Institution
          </button>
        )}
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search institutions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredInstitutions.map((institution) => (
          <div
            key={institution._id}
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="bg-blue-100 p-3 rounded-lg">
                <Building2 className="w-6 h-6 text-blue-600" />
              </div>
              {canEdit && (
                <div className="flex space-x-2">
                  <button
                    onClick={() => {
                      setEditingInstitution(institution);
                      setShowModal(true);
                    }}
                    className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(institution._id)}
                    className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            <h3 className="text-lg font-semibold text-gray-900 mb-2">{institution.name}</h3>

            <div className="space-y-2 text-sm">
              <div className="flex text-gray-600">
                <span className="font-medium mr-2">Type:</span>
                <span className="capitalize">{institution.type.replace('_', ' ')}</span>
              </div>
              <div className="flex text-gray-600">
                <span className="font-medium mr-2">Location:</span>
                <span>{institution.location.city}, {institution.location.country}</span>
              </div>
              <div className="flex text-gray-600">
                <span className="font-medium mr-2">Contact:</span>
                <span className="truncate">{institution.contactEmail}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredInstitutions.length === 0 && (
        <div className="text-center py-12">
          <Building2 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No institutions found</h3>
          <p className="text-gray-600">
            {searchTerm ? 'Try adjusting your search' : 'Get started by adding institutions'}
          </p>
        </div>
      )}

      {showModal && (
        <InstitutionModal
          institution={editingInstitution}
          onClose={() => {
            setShowModal(false);
            setEditingInstitution(null);
          }}
          onSuccess={() => {
            setShowModal(false);
            setEditingInstitution(null);
            loadInstitutions();
          }}
        />
      )}
    </div>
  );
}

function InstitutionModal({ institution, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    name: institution?.name || '',
    type: institution?.type || 'university',
    country: institution?.location?.country || '',
    city: institution?.location?.city || '',
    contactEmail: institution?.contactEmail || '',
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        name: formData.name,
        type: formData.type,
        country: formData.country,
        city: formData.city,
        contactEmail: formData.contactEmail,
      };

      let response;
      if (institution) {
        response = await institutionsAPI.update(institution._id, payload);
      } else {
        response = await institutionsAPI.create(payload);
      }

      if (response.success) {
        onSuccess();
      }
    } catch (error) {
      console.error('Error saving institution:', error);
      alert(error.message || 'Failed to save institution');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          {institution ? 'Edit Institution' : 'Add Institution'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Institution Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="university">University</option>
              <option value="college">College</option>
              <option value="training_center">Training Center</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
            <input
              type="text"
              value={formData.country}
              onChange={(e) => setFormData({ ...formData, country: e.target.value })}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
            <input
              type="text"
              value={formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Contact Email
            </label>
            <input
              type="email"
              value={formData.contactEmail}
              onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}