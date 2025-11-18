import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useAnalyticsAPI } from '../api/analytics';
import { 
  BarChart3, 
  BookOpen, 
  Briefcase, 
  TrendingUp, 
  ArrowRight,
  CheckCircle,
  AlertCircle,
  Clock
} from 'lucide-react';

// Helper Component: Stat Card
const StatCard = ({ title, value, change, icon, positive }) => {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="p-6 pb-2 flex flex-row items-center justify-between space-y-0">
        <h3 className="text-sm font-medium text-gray-900">{title}</h3>
        <div className="text-gray-500">
          {icon}
        </div>
      </div>
      <div className="p-6 pt-0">
        <div className="text-2xl font-bold text-gray-900">{value}</div>
        <p className={`text-xs ${positive ? 'text-green-600' : 'text-gray-500'}`}>
          {change}
        </p>
      </div>
    </div>
  );
};

// Helper Component: Action Button
const ActionButton = ({ title, description, href }) => {
  return (
    <Link to={href}>
      <div className="p-4 border border-gray-200 rounded-lg hover:bg-blue-50 transition-colors cursor-pointer group bg-white h-full">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-semibold mb-1 text-gray-900 group-hover:text-blue-600 transition-colors">{title}</h3>
            <p className="text-sm text-gray-500">{description}</p>
          </div>
          <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-blue-600 transition-colors" />
        </div>
      </div>
    </Link>
  );
};

// Helper Component: Skill Item
const SkillItem = ({ skill, count }) => {
  return (
    <div className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
      <span className="font-medium text-gray-900">{skill}</span>
      <span className="text-sm text-gray-500">{count}</span>
    </div>
  );
};

export function InstitutionDashboard() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  
  // State for Dashboard Data
  const [stats, setStats] = useState({
    activePrograms: 0,
    curriculaAnalyzed: 0,
    jobPostingsTracked: 0,
    matchRate: 0,
    matchRateChange: 'Avg across all programs',
    activeProgramsChange: 'Total active',
    jobsChange: 'Last 30 days'
  });

  const [programOverview, setProgramOverview] = useState([]);
  const [topSkills, setTopSkills] = useState([]);

  const analyticsAPI = useAnalyticsAPI();

  useEffect(() => {
    loadDashboardData();
  }, [user]);

  const loadDashboardData = async () => {
    try {
      if (user?.institutionId) {
        const dashboardResponse = await analyticsAPI.getDashboard(user.institutionId);

        if (dashboardResponse.success) {
          const data = dashboardResponse.data;
          const metrics = data.institutionMetrics || {};

          // 1. Update Stats Cards
          setStats({
            activePrograms: metrics.totalPrograms || 0,
            curriculaAnalyzed: metrics.analyzedPrograms || 0,
            jobPostingsTracked: metrics.recentJobPostings ? metrics.recentJobPostings.toLocaleString() : '0',
            matchRate: metrics.avgMatchRate || 0,
            matchRateChange: 'Average match rate',
            activeProgramsChange: 'Active programs',
            jobsChange: 'New jobs (30 days)'
          });

          // 2. Update Program Overview List
          setProgramOverview(data.programAnalyses || []);

          // 3. Update Top Skills
          const skillsData = (data.topSkills || []).map(skill => ({
            skill: skill.name,
            count: `${skill.demand} mentions`
          }));
          setTopSkills(skillsData);
        }
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getMatchRateColor = (rate) => {
    if (!rate) return 'text-gray-400';
    if (rate >= 80) return 'text-green-600';
    if (rate >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome back, {user?.name || 'User'}</h1>
        <p className="text-gray-600">Overview of your institution's curricular performance</p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Active Programs"
          value={stats.activePrograms}
          change={stats.activeProgramsChange}
          icon={<BookOpen className="h-4 w-4" />}
        />
        <StatCard
          title="Curricula Analyzed"
          value={stats.curriculaAnalyzed}
          change="Processed by AI"
          icon={<BarChart3 className="h-4 w-4" />}
        />
        <StatCard
          title="Job Market Data"
          value={stats.jobPostingsTracked}
          change={stats.jobsChange}
          icon={<Briefcase className="h-4 w-4" />}
        />
        <StatCard
          title="Avg. Match Rate"
          value={`${stats.matchRate}%`}
          change={stats.matchRateChange}
          icon={<TrendingUp className="h-4 w-4" />}
          positive={true}
        />
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 pb-4 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900">Quick Actions</h3>
          <p className="text-sm text-gray-500">Common tasks and shortcuts</p>
        </div>
        <div className="p-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <ActionButton
              title="Manage Curricula"
              description="Add, edit or remove program curricula"
              href="/app/curricula"
            />
             <ActionButton
              title="Run New Analysis"
              description="Analyze a curriculum against current market"
              href="/app/curricula"
            />
            <ActionButton
              title="View Reports"
              description="Detailed analytics and gap reports"
              href="/app/analytics"
            />
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        
        {/* Left Column: Program Overview Table (Spans 2 columns) */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow-sm border border-gray-200 flex flex-col">
          <div className="p-6 border-b border-gray-100 flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Curricula Overview</h3>
              <p className="text-sm text-gray-500">Performance status of your offered programs</p>
            </div>
            <Link to="/app/curricula" className="text-blue-600 text-sm hover:underline font-medium">
              View All
            </Link>
          </div>
          
          <div className="flex-1 overflow-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3">Program Name</th>
                  <th className="px-6 py-3">Degree</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Match Rate</th>
                  <th className="px-6 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {programOverview.length > 0 ? (
                  programOverview.map((program) => (
                    <tr key={program.curriculumId} className="bg-white border-b hover:bg-gray-50">
                      <td className="px-6 py-4 font-medium text-gray-900">
                        {program.programName}
                        <div className="text-xs text-gray-500 font-normal">{program.department}</div>
                      </td>
                      <td className="px-6 py-4 capitalize">{program.degree}</td>
                      <td className="px-6 py-4">
                        {program.isAnalyzed ? (
                          <span className="inline-flex items-center text-green-700 bg-green-100 px-2 py-1 rounded-full text-xs">
                            <CheckCircle className="w-3 h-3 mr-1" /> Analyzed
                          </span>
                        ) : (
                          <span className="inline-flex items-center text-gray-600 bg-gray-100 px-2 py-1 rounded-full text-xs">
                            <Clock className="w-3 h-3 mr-1" /> Pending
                          </span>
                        )}
                      </td>
                      <td className={`px-6 py-4 font-semibold ${getMatchRateColor(program.matchRate)}`}>
                        {program.matchRate ? `${program.matchRate}%` : '-'}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => navigate(`/app/analysis/${program.curriculumId}`)}
                          className="text-blue-600 hover:text-blue-900 font-medium"
                        >
                          {program.isAnalyzed ? 'View Report' : 'Analyze'}
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                      No curricula found. <Link to="/app/curricula" className="text-blue-600 hover:underline">Add your first program</Link>.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column: Top Skills (Spans 1 column) */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 h-fit">
          <div className="p-6 border-b border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900">Market Demand</h3>
            <p className="text-sm text-gray-500">Top skills requested in job postings</p>
          </div>
          <div className="p-6">
            <div className="space-y-1">
              {topSkills.length > 0 ? (
                topSkills.map((item, index) => (
                  <SkillItem
                    key={index}
                    skill={item.skill}
                    count={item.count}
                  />
                ))
              ) : (
                <div className="text-center py-6 text-gray-500">
                  <AlertCircle className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                  <p>No market data available.</p>
                </div>
              )}
            </div>
            <div className="mt-6 pt-4 border-t border-gray-100">
              <Link to="/app/analytics" className="flex items-center justify-center text-sm text-blue-600 hover:text-blue-800 font-medium">
                View Full Market Analysis <ArrowRight className="w-4 h-4 ml-1" />
              </Link>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

export default InstitutionDashboard;