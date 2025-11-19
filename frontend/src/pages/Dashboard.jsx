import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useInstitutionsAPI } from '../api/institutions';
import { useCurriculaAPI } from '../api/curricula';
import { useJobsAPI } from '../api/jobs';
import { PageLayout } from '../components/layout/PageLayout';
import { BookOpen, Briefcase, TrendingUp, Building2, ArrowRight } from 'lucide-react';
import { InstitutionDashboard } from './InstitutionDashboard';
import { AdminDashboard } from './AdminDashboard'; // ✅ Import AdminDashboard

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

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      // Optimization: Only load global stats if not specific role
      if (user?.role !== 'institution' && user?.role !== 'admin') {
        const [institutions, curricula, jobs] = await Promise.all([
          institutionsAPI.getAll(),
          curriculaAPI.getAll(),
          jobsAPI.getStats(),
        ]);

        setStats({
          totalInstitutions: institutions.count || 0,
          totalCurricula: curricula.count || 0,
          totalJobs: jobs.data?.totalJobs || 0,
          totalAnalyses: 0,
        });
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  // ✅ 1. Check for Admin Role
  if (user?.role === 'admin') {
    return <AdminDashboard />;
  }

  // ✅ 2. Check for Institution Role
  if (user?.role === 'institution') {
    return <InstitutionDashboard />;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-400 text-sm">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mr-3"></div>
        Loading platform data...
      </div>
    );
  }

  const statCards = [
    {
      title: 'Institutions',
      value: stats.totalInstitutions,
      icon: Building2,
      color: 'bg-blue-500',
      subColor: 'bg-blue-50 text-blue-600',
      link: '/app/institutions',
    },
    {
      title: 'Curricula',
      value: stats.totalCurricula,
      icon: BookOpen,
      color: 'bg-emerald-500',
      subColor: 'bg-emerald-50 text-emerald-600',
      link: '/app/curricula',
    },
    {
      title: 'Job Postings',
      value: stats.totalJobs,
      icon: Briefcase,
      color: 'bg-amber-500',
      subColor: 'bg-amber-50 text-amber-600',
      link: '/app/jobs',
    },
    {
      title: 'Analyses Run',
      value: stats.totalAnalyses,
      icon: TrendingUp,
      color: 'bg-purple-500',
      subColor: 'bg-purple-50 text-purple-600',
      link: '/app/analytics',
    },
  ];

  return (
    <PageLayout
      title={`Welcome back, ${user?.name?.split(' ')[0]}!`}
      description="Platform Overview & Global Statistics"
    >
      {/* Stats Grid - Compact & Professional */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => (
          <Link
            key={card.title}
            to={card.link}
            className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 hover:shadow-md transition-all duration-200 group"
          >
            <div className="flex items-center justify-between mb-3">
              <div className={`p-2 rounded-lg ${card.subColor}`}>
                <card.icon className="w-5 h-5" />
              </div>
              <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500 transition-colors" />
            </div>
            
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-0.5">
                {card.title}
              </p>
              <p className="text-2xl font-bold text-slate-900">
                {card.value.toLocaleString()}
              </p>
            </div>
          </Link>
        ))}
      </div>

      {/* Feature/CTA Section - Redesigned for Compactness */}
      <div className="relative overflow-hidden rounded-xl bg-slate-900 p-8 shadow-lg">
        {/* Abstract decorative circle */}
        <div className="absolute top-0 right-0 -mr-16 -mt-16 h-64 w-64 rounded-full bg-white/5 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 -ml-16 -mb-16 h-64 w-64 rounded-full bg-blue-500/10 blur-3xl"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="max-w-xl">
            <h2 className="text-xl font-bold text-white mb-2">
              AI-Powered Skills Gap Analysis
            </h2>
            <p className="text-slate-300 text-sm leading-relaxed">
              Analyze curriculum-market alignment and identify critical skills gaps using our advanced machine learning models. Get actionable insights in seconds.
            </p>
          </div>
          
          <div className="flex shrink-0 gap-3">
            <Link
              to="/app/jobs"
              className="inline-flex items-center px-4 py-2 bg-slate-800 text-slate-200 text-sm font-medium rounded-lg hover:bg-slate-700 border border-slate-700 transition-colors"
            >
              View Market Data
            </Link>
            <Link
              to="/app/curricula"
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-500 transition-colors shadow-sm shadow-blue-900/20"
            >
              Start Analysis
              <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </div>
        </div>
      </div>

      {/* Quick Actions / Recent Activity Placeholder */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 min-h-[200px] flex flex-col items-center justify-center text-center">
          <div className="p-3 bg-slate-50 rounded-full mb-3">
            <Building2 className="w-6 h-6 text-slate-400" />
          </div>
          <h3 className="text-sm font-semibold text-slate-900">Manage Institutions</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-xs">
            Add or edit educational institutions and their access levels.
          </p>
          <Link to="/app/institutions" className="mt-3 text-xs font-medium text-blue-600 hover:underline">
            Go to Institutions &rarr;
          </Link>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 min-h-[200px] flex flex-col items-center justify-center text-center">
          <div className="p-3 bg-slate-50 rounded-full mb-3">
            <TrendingUp className="w-6 h-6 text-slate-400" />
          </div>
          <h3 className="text-sm font-semibold text-slate-900">System Analytics</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-xs">
            Monitor system-wide usage metrics and analysis performance.
          </p>
          <Link to="/app/analytics" className="mt-3 text-xs font-medium text-blue-600 hover:underline">
            View Analytics &rarr;
          </Link>
        </div>
      </div>
    </PageLayout>
  );
}