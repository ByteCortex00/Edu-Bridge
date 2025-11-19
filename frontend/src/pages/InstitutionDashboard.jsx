import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useAnalyticsAPI } from '../api/analytics';
import { PageLayout } from '../components/layout/PageLayout'; // ✅ Import PageLayout
import { 
  BookOpen, Briefcase, TrendingUp, CheckCircle, Plus, ArrowRight 
} from 'lucide-react';

// 1. Compact Stat Card (Reduced padding p-6 -> p-4)
const StatCard = ({ title, value, change, icon, color = "blue" }) => {
  const colorClasses = {
    blue: "bg-blue-50 text-blue-600",
    green: "bg-emerald-50 text-emerald-600",
    purple: "bg-purple-50 text-purple-600",
    orange: "bg-orange-50 text-orange-600"
  };

  return (
    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
      <div className="flex justify-between items-start mb-2">
        <div className={`p-2 rounded-lg ${colorClasses[color]}`}>
          {icon}
        </div>
        {change && (
          <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
            {change}
          </span>
        )}
      </div>
      <h3 className="text-slate-500 text-xs font-semibold uppercase tracking-wide mb-0.5">{title}</h3>
      <p className="text-xl md:text-2xl font-bold text-slate-900 leading-tight">{value}</p>
    </div>
  );
};

export function InstitutionDashboard() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    activePrograms: 0,
    curriculaAnalyzed: 0,
    jobPostingsTracked: 0,
    matchRate: 0
  });
  const [programOverview, setProgramOverview] = useState([]);
  const [topSkills, setTopSkills] = useState([]);
  const analyticsAPI = useAnalyticsAPI();

  useEffect(() => {
    const loadData = async () => {
      try {
        if (user?.institutionId) {
          const res = await analyticsAPI.getDashboard(user.institutionId);
          if (res.success) {
            const m = res.data.institutionMetrics || {};
            setStats({
              activePrograms: m.totalPrograms || 0,
              curriculaAnalyzed: m.analyzedPrograms || 0,
              jobPostingsTracked: m.recentJobPostings || 0,
              matchRate: m.avgMatchRate || 0
            });
            setProgramOverview(res.data.programAnalyses || []);
            setTopSkills(res.data.topSkills || []);
          }
        }
      } catch (e) { console.error(e); } 
      finally { setLoading(false); }
    };
    loadData();
  }, [user]);

  // Define the Header Button
  const headerAction = (
    <Link 
      to="/app/curricula" 
      className="inline-flex items-center justify-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors shadow-sm shadow-blue-200"
    >
      <Plus className="w-4 h-4 mr-2" />
      New Curriculum
    </Link>
  );

  if (loading) return <div className="p-8 text-center text-slate-400 text-sm">Loading dashboard...</div>;

  return (
    <PageLayout
      title="Dashboard"
      description="Overview of your institution's performance"
      headerContent={headerAction}
    >
      {/* Stats Grid - Reduced Gap (gap-6 -> gap-4) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Active Programs" value={stats.activePrograms} icon={<BookOpen className="w-5 h-5" />} color="blue" />
        <StatCard title="Curricula Analyzed" value={stats.curriculaAnalyzed} icon={<CheckCircle className="w-5 h-5" />} color="green" />
        <StatCard title="Avg Match Rate" value={`${stats.matchRate}%`} icon={<TrendingUp className="w-5 h-5" />} color="purple" />
        <StatCard title="Market Data" value={stats.jobPostingsTracked.toLocaleString()} icon={<Briefcase className="w-5 h-5" />} color="orange" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Main Table Card */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col">
          <div className="px-5 py-3 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <h3 className="font-semibold text-slate-800 text-sm">Curricula Status</h3>
            <Link to="/app/curricula" className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center">
              View All <ArrowRight className="w-3 h-3 ml-1" />
            </Link>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-100">
                <tr>
                  <th className="px-5 py-3 text-xs uppercase tracking-wider w-1/2">Program</th>
                  <th className="px-5 py-3 hidden sm:table-cell text-xs uppercase tracking-wider">Status</th>
                  <th className="px-5 py-3 text-xs uppercase tracking-wider">Score</th>
                  <th className="px-5 py-3 text-right text-xs uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {programOverview.slice(0, 5).map((p) => ( // Limit to 5 items for compactness
                  <tr key={p.curriculumId} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-5 py-3">
                      <div className="font-medium text-slate-900 truncate max-w-[200px]">{p.programName}</div>
                      <div className="text-[10px] text-slate-500 capitalize">{p.degree}</div>
                    </td>
                    <td className="px-5 py-3 hidden sm:table-cell">
                      {p.isAnalyzed ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100 uppercase tracking-wide">
                          Analyzed
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200 uppercase tracking-wide">
                          Pending
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center">
                        <div className="w-12 bg-slate-100 rounded-full h-1.5 mr-2">
                          <div 
                            className={`h-1.5 rounded-full ${p.matchRate >= 70 ? 'bg-emerald-500' : p.matchRate >= 50 ? 'bg-yellow-500' : 'bg-slate-400'}`} 
                            style={{ width: `${p.matchRate || 0}%` }}
                          ></div>
                        </div>
                        <span className="font-medium text-slate-700 text-xs">{p.matchRate || 0}%</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <button 
                        onClick={() => navigate(`/app/analysis/${p.curriculumId}`)}
                        className="text-blue-600 hover:text-blue-800 font-medium text-xs hover:underline"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
                 {programOverview.length === 0 && (
                  <tr>
                    <td colSpan="4" className="px-5 py-8 text-center text-slate-400 text-sm">No programs found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Side Panel: Market Skills */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-4 h-fit">
          <h3 className="font-semibold text-slate-800 mb-3 text-sm">Trending Skills</h3>
          <div className="space-y-2">
            {topSkills.slice(0, 5).map((skill, i) => (
              <div key={i} className="flex items-center justify-between group py-1">
                <div className="flex items-center">
                  <span className="w-5 text-xs font-bold text-slate-300 group-hover:text-blue-500 transition-colors">#{i + 1}</span>
                  <span className="text-slate-700 font-medium text-xs md:text-sm">{skill.name}</span>
                </div>
                <span className="text-[10px] font-medium text-slate-500 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100">
                  {skill.demand}
                </span>
              </div>
            ))}
            {topSkills.length === 0 && <p className="text-slate-400 text-xs">No data available yet.</p>}
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100">
             <Link to="/app/analytics" className="flex items-center justify-center w-full py-1.5 border border-slate-200 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors">
               View Full Report
             </Link>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}

export default InstitutionDashboard;