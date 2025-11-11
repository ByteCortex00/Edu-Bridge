import { useState, useEffect } from 'react';
import { analyticsAPI } from '../api/analytics';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp } from 'lucide-react';

export function Analytics() {
  const [topSkills, setTopSkills] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      const response = await analyticsAPI.getTopSkills({
        limit: 10,
        daysBack: 90
      });

      if (response.success) {
        const formatted = response.data.map(skill => ({
          name: skill.name,
          count: skill.jobCount
        }));
        setTopSkills(formatted);
      }
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
        <p className="text-gray-600 mt-1">Explore insights and trends</p>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Top In-Demand Skills</h2>
        {topSkills.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={topSkills}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-gray-600 text-center py-8">No skills data available</p>
        )}
      </div>

      <div className="bg-gradient-to-r from-blue-500 to-green-500 rounded-lg shadow-lg p-8 text-white">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-2">Skills Gap Insights</h2>
            <p className="text-blue-50">
              Run curriculum-specific analysis to identify critical skills gaps
            </p>
          </div>
          <TrendingUp className="w-12 h-12 text-blue-200" />
        </div>
      </div>
    </div>
  );
}