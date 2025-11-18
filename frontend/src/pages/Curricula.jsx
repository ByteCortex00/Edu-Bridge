import { useEffect, useState } from 'react';
import { useCurriculaAPI } from '../api/curricula';
import { useAuthStore } from '../store/authStore';
import { BookOpen, Search, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PageLayout } from '../components/layout/PageLayout';

export function Curricula() {
  const [curricula, setCurricula] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDegree, setFilterDegree] = useState('all');
  const navigate = useNavigate();
  const curriculaAPI = useCurriculaAPI();
  const { user } = useAuthStore();

  useEffect(() => {
    loadCurricula();
  }, [filterDegree, user]); // Add user to dependency array

  const loadCurricula = async () => {
    try {
      const params = {};
      
      // Filter by Degree
      if (filterDegree !== 'all') {
        params.degree = filterDegree;
      }

      //
      // Security Check: If user is an institution, ONLY show their curricula
      if (user?.role === 'institution' && user?.institutionId) {
        params.institutionId = user.institutionId;
      }

      const response = await curriculaAPI.getAll(params);
      if (response.success) {
        setCurricula(response.data);
      }
    } catch (error) {
      console.error('Error loading curricula:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredCurricula = curricula.filter((curr) => {
    const matchesSearch =
      curr.programName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      curr.department.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesSearch;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const filterContent = (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
        <input
          type="text"
          placeholder="Search curricula..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-9 sm:pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
        />
      </div>

      <div className="flex items-center space-x-4">
        <label className="text-sm font-medium text-gray-700">Degree:</label>
        <select
          value={filterDegree}
          onChange={(e) => setFilterDegree(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
        >
          <option value="all">All Degrees</option>
          <option value="bachelor">Bachelor</option>
          <option value="master">Master</option>
          <option value="phd">PhD</option>
          <option value="diploma">Diploma</option>
          <option value="certificate">Certificate</option>
        </select>
      </div>
    </div>
  );

  return (
    <PageLayout
      title={user?.role === 'institution' ? "My Curricula" : "All Curricula"}
      description={user?.role === 'institution' ? "Manage and analyze your institution's programs" : "Browse and analyze educational programs"}
      headerContent={filterContent}
    >
      {/* Updated grid for better tablet responsiveness */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        {filteredCurricula.map((curriculum) => (
          <div
            key={curriculum._id}
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="bg-green-100 p-2 sm:p-3 rounded-lg">
                <BookOpen className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
              </div>
              <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded-full uppercase">
                {curriculum.degree}
              </span>
            </div>

            <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
              {curriculum.programName}
            </h3>

            <div className="space-y-2 text-sm mb-4">
              <div className="flex text-gray-600">
                <span className="font-medium mr-2">Department:</span>
                <span className="truncate">{curriculum.department}</span>
              </div>
              
              {/* Show Institution Name only if NOT an institution user (redundant otherwise) */}
              {user?.role !== 'institution' && curriculum.institutionId && (
                 <div className="flex text-gray-600">
                  <span className="font-medium mr-2">Institution:</span>
                  <span className="truncate">{curriculum.institutionId.name}</span>
                </div>
              )}

              <div className="flex text-gray-600">
                <span className="font-medium mr-2">Duration:</span>
                <span>{curriculum.duration} months</span>
              </div>
            </div>

            <p className="text-sm text-gray-600 mb-4 line-clamp-2">
              {curriculum.description}
            </p>

            <button
              onClick={() => navigate(`/app/analysis/${curriculum._id}`)}
              className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
            >
              <TrendingUp className="w-4 h-4 mr-2" />
              Analyze
            </button>
          </div>
        ))}
      </div>

      {filteredCurricula.length === 0 && (
        <div className="text-center py-12">
          <BookOpen className="w-12 h-12 sm:w-16 sm:h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No curricula found</h3>
          <p className="text-gray-600">Try adjusting your search criteria</p>
        </div>
      )}
    </PageLayout>
  );
}