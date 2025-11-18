import { useState, useEffect } from 'react';
import { useAnalyticsAPI } from '../api/analytics';
import { useAuthStore } from '../store/authStore';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, Briefcase, Users, Target, ChevronLeft, ChevronRight } from 'lucide-react';
import { PageLayout } from '../components/layout/PageLayout';

export function Analytics() {
  const [categoryAnalytics, setCategoryAnalytics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const categoriesPerPage = 5;
  const analyticsAPI = useAnalyticsAPI();
  const { user } = useAuthStore();

  useEffect(() => {
    loadAnalytics();
  }, [user]); // Dependency on user to trigger filter change on login/sync

  useEffect(() => {
    // Reset to page 1 when filter changes
    setCurrentPage(1);
  }, [selectedCategory]);

  useEffect(() => {
    // Reset to page 1 when filter changes
    setCurrentPage(1);
  }, [selectedCategory]);

  const loadAnalytics = async () => {
    try {
      const params = {
        limit: 10,
        daysBack: 90
      };

      // Filter by user's institution target industries if applicable
      //
      if (user?.role === 'institution' && user?.institutionId) {
          params.institutionId = user.institutionId;
          // When institutionId is set, the backend logic overrides the global category filter
          setSelectedCategory('all');
      } else if (selectedCategory !== 'all') {
          params.category = selectedCategory;
      }

      const response = await analyticsAPI.getTopSkills(params);

      if (response.success) {
        setCategoryAnalytics(response.data);
      }
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredCategories = selectedCategory === 'all'
    ? categoryAnalytics
    : categoryAnalytics.filter(cat => cat.category === selectedCategory);

  // Pagination logic
  const totalPages = Math.ceil(filteredCategories.length / categoriesPerPage);
  const startIndex = (currentPage - 1) * categoriesPerPage;
  const endIndex = startIndex + categoriesPerPage;
  const currentCategories = filteredCategories.slice(startIndex, endIndex);

  const handlePageChange = (page) => {
    setCurrentPage(page);
    // Scroll to top of categories section
    window.scrollTo({ top: 200, behavior: 'smooth' });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const filterContent = (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      <div className="flex items-center space-x-4">
        <label className="text-sm font-medium text-gray-700">Filter by Category:</label>
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
        >
          <option value="all">All Categories</option>
          {categoryAnalytics.map(cat => (
            <option key={cat.category} value={cat.category}>{cat.category}</option>
          ))}
        </select>
      </div>
    </div>
  );

  return (
    <PageLayout
      title="Category-Based Analytics"
      description="Skills insights organized by job categories"
      headerContent={filterContent}
    >
      {/* Category Analytics */}
      <div className="grid grid-cols-1 gap-6">
        {currentCategories.map((categoryData) => (
          <div key={categoryData.category} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">{categoryData.category}</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div className="flex items-center space-x-2">
                    <Briefcase className="w-4 h-4 text-blue-600" />
                    <span className="text-gray-600">Jobs: <span className="font-semibold text-gray-900">{categoryData.totalJobsInCategory}</span></span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Target className="w-4 h-4 text-green-600" />
                    <span className="text-gray-600">Top Skills: <span className="font-semibold text-gray-900">{categoryData.topSkills.length}</span></span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <TrendingUp className="w-4 h-4 text-purple-600" />
                    <span className="text-gray-600">Most Demanded: <span className="font-semibold text-gray-900">{categoryData.topSkills[0]?.name || 'N/A'}</span></span>
                  </div>
                </div>
              </div>
            </div>

            {categoryData.topSkills.length > 0 ? (
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Top Skills in Demand</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={categoryData.topSkills}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="name"
                      angle={-45}
                      textAnchor="end"
                      height={80}
                      fontSize={12}
                    />
                    <YAxis />
                    <Tooltip
                      formatter={(value, name) => [
                        name === 'count' ? `${value} jobs` : `${value}%`,
                        name === 'count' ? 'Job Count' : 'Demand %'
                      ]}
                    />
                    <Bar dataKey="count" fill="#3b82f6" name="count" />
                  </BarChart>
                </ResponsiveContainer>

                {/* Skills List */}
                <div className="mt-6">
                  <h4 className="text-md font-medium text-gray-900 mb-3">Skills Breakdown</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {categoryData.topSkills.map((skill, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex-1">
                          <span className="font-medium text-gray-900">{skill.name}</span>
                          <span className="ml-2 text-xs text-gray-500 bg-gray-200 px-2 py-1 rounded">
                            {skill.category}
                          </span>
                        </div>
                        <div className="text-right text-sm">
                          <div className="font-semibold text-blue-600">{skill.count} jobs</div>
                          <div className="text-gray-500">{skill.demandPercentage}% demand</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <Target className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No skills data available for this category</p>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="text-sm text-gray-700">
            Showing {startIndex + 1}-{Math.min(endIndex, filteredCategories.length)} of {filteredCategories.length} categories
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="flex items-center px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Previous
            </button>

            <div className="flex items-center space-x-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(page => {
                  // Show first page, last page, current page, and pages around current
                  return page === 1 ||
                         page === totalPages ||
                         (page >= currentPage - 1 && page <= currentPage + 1);
                })
                .map((page, index, array) => (
                  <div key={page} className="flex items-center">
                    {index > 0 && array[index - 1] !== page - 1 && (
                      <span className="px-2 text-gray-400">...</span>
                    )}
                    <button
                      onClick={() => handlePageChange(page)}
                      className={`px-3 py-2 text-sm font-medium rounded-md ${
                        page === currentPage
                          ? 'bg-blue-600 text-white'
                          : 'text-gray-500 bg-white border border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {page}
                    </button>
                  </div>
                ))}
            </div>

            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="flex items-center px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
              <ChevronRight className="w-4 h-4 ml-1" />
            </button>
          </div>
        </div>
      )}

      {filteredCategories.length === 0 && (
        <div className="text-center py-12">
          <Briefcase className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No categories found</h3>
          <p className="text-gray-600">Try adjusting your filter or check if data is available</p>
        </div>
      )}

      <div className="bg-gradient-to-r from-blue-500 to-green-500 rounded-lg shadow-lg p-8 text-white">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-2">Category-Specific Insights</h2>
            <p className="text-blue-50">
              Each job category has unique skill requirements. Use these insights to align curricula with industry demands.
            </p>
          </div>
          <TrendingUp className="w-12 h-12 text-blue-200" />
        </div>
      </div>
    </PageLayout>
  );
}