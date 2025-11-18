import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useInstitutionsAPI } from '../api/institutions';
import { useCurriculaAPI } from '../api/curricula';
import { useJobsAPI } from '../api/jobs';
import { useAnalyticsAPI } from '../api/analytics';
import { BookOpen, Briefcase, TrendingUp, Building2, ArrowRight } from 'lucide-react';
import { InstitutionDashboard } from './InstitutionDashboard';

export function Dashboard() {
  const { user } = useAuthStore();
  const [stats, setStats] = useState({
    totalInstitutions: 0,
    totalCurricula: 0,
    totalJobs: 0,
    totalAnalyses: 0,
  });
  const [loading, setLoading] = useState(true);
  const institutionsAPI = useInstitutionsAPI();
  const curriculaAPI = useCurriculaAPI();
  const jobsAPI = useJobsAPI();
  const analyticsAPI = useAnalyticsAPI();

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const [institutions, curricula, jobs] = await Promise.all([
        institutionsAPI.getAll(),
        curriculaAPI.getAll(),
        jobsAPI.getStats(),
      ]);

      setStats({
        totalInstitutions: institutions.count || 0,
        totalCurricula: curricula.count || 0,
        totalJobs: jobs.data?.totalJobs || 0,
        totalAnalyses: 0, // Will be updated when we add analytics
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: 'Institutions',
      value: stats.totalInstitutions,
      icon: Building2,
      color: 'bg-blue-500',
      link: '/app/institutions',
    },
    {
      title: 'Curricula',
      value: stats.totalCurricula,
      icon: BookOpen,
      color: 'bg-green-500',
      link: '/app/curricula',
    },
    {
      title: 'Job Postings',
      value: stats.totalJobs,
      icon: Briefcase,
      color: 'bg-amber-500',
      link: '/app/jobs',
    },
    {
      title: 'Analyses Run',
      value: stats.totalAnalyses,
      icon: TrendingUp,
      color: 'bg-purple-500',
      link: '/app/analytics',
    },
  ];

  if (user?.role === 'institution') {
    return <InstitutionDashboard />;
  }

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
        <h1 className="text-3xl font-bold text-gray-900">
          Welcome back, {user?.name}!
        </h1>
        <p className="text-gray-600 mt-1">
          Here's an overview of your Skills Gap Analysis Platform
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card) => (
          <Link
            key={card.title}
            to={card.link}
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">{card.title}</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {card.value.toLocaleString()}
                </p>
              </div>
              <div className={`${card.color} p-3 rounded-lg`}>
                <card.icon className="w-6 h-6 text-white" />
              </div>
            </div>
          </Link>
        ))}
      </div>

      <div className="bg-gradient-to-r from-blue-500 to-green-500 rounded-lg shadow-lg p-8 text-white">
        <h2 className="text-2xl font-bold mb-2">AI-Powered Skills Gap Analysis</h2>
        <p className="text-blue-50 mb-4">
          Analyze curriculum-market alignment and identify critical skills gaps
        </p>
        <Link
          to="/app/curricula"
          className="inline-flex items-center px-6 py-3 bg-white text-blue-600 rounded-lg font-semibold hover:bg-blue-50 transition-colors"
        >
          Get Started
          <ArrowRight className="w-5 h-5 ml-2" />
        </Link>
      </div>
    </div>
  );
}
