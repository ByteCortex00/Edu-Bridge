// src/pages/AdminDashboard.jsx
import { useEffect, useState } from 'react';
import { useJobsAPI } from '../api/jobs';
import { useCurriculaAPI } from '../api/curricula';
import { PageLayout } from '../components/layout/PageLayout';
import { 
  Database, Server, RefreshCw, DownloadCloud, Activity, 
  Cpu, CheckCircle, AlertCircle, Play 
} from 'lucide-react';

export function AdminDashboard() {
  const jobsAPI = useJobsAPI();
  const curriculaAPI = useCurriculaAPI();

  // State
  const [jobStatus, setJobStatus] = useState(null);
  const [currStatus, setCurrStatus] = useState(null);
  const [mlHealth, setMlHealth] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Action Loading States
  const [ingesting, setIngesting] = useState(false);
  const [embeddingJobs, setEmbeddingJobs] = useState(false);
  const [embeddingCurr, setEmbeddingCurr] = useState(false);

  // Configuration for Bulk Ingest
  const [ingestConfig, setIngestConfig] = useState({
    resultsPerCategory: 50,
    countries: ["gb", "us", "ke"] // Default countries
  });

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [jStatus, cStatus, mlTest] = await Promise.all([
        jobsAPI.getEmbeddingStatus(),
        curriculaAPI.getEmbeddingStatus(),
        jobsAPI.testML()
      ]);

      if (jStatus.success) setJobStatus(jStatus.data);
      if (cStatus.success) setCurrStatus(cStatus.data);
      if (mlTest.success) setMlHealth(mlTest.data);
    } catch (error) {
      console.error("Failed to load admin data", error);
    } finally {
      setLoading(false);
    }
  };

  // --- Actions ---

  const handleBulkIngest = async () => {
    if (!confirm("This will fetch jobs from Adzuna API. It may take a few minutes. Continue?")) return;
    setIngesting(true);
    try {
      const res = await jobsAPI.bulkPopulate({
        countries: ingestConfig.countries,
        resultsPerCategory: ingestConfig.resultsPerCategory
      });
      alert(res.message || "Ingestion started successfully");
      loadDashboardData(); // Refresh stats
    } catch (error) {
      alert("Ingestion failed: " + error.message);
    } finally {
      setIngesting(false);
    }
  };

  const handleGenerateJobEmbeddings = async () => {
    setEmbeddingJobs(true);
    try {
      const res = await jobsAPI.generateEmbeddings({ limit: 500 });
      alert(res.message);
      loadDashboardData();
    } catch (error) {
      alert("Failed: " + error.message);
    } finally {
      setEmbeddingJobs(false);
    }
  };

  const handleGenerateCurrEmbeddings = async () => {
    setEmbeddingCurr(true);
    try {
      const res = await curriculaAPI.generateEmbeddings({ forceRegenerate: true });
      alert(res.message);
      loadDashboardData();
    } catch (error) {
      alert("Failed: " + error.message);
    } finally {
      setEmbeddingCurr(false);
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
    <PageLayout 
      title="Platform Administration" 
      description="Manage system data, ML pipelines, and integrations"
    >
      {/* 1. System Health Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {/* ML Service Health */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-slate-500 text-xs font-semibold uppercase tracking-wide">ML Engine Status</p>
            <div className="flex items-center mt-1">
              {mlHealth?.modelReady ? (
                <>
                  <div className="w-2 h-2 bg-emerald-500 rounded-full mr-2 animate-pulse"></div>
                  <span className="text-lg font-bold text-slate-900">Operational</span>
                </>
              ) : (
                <>
                  <div className="w-2 h-2 bg-red-500 rounded-full mr-2"></div>
                  <span className="text-lg font-bold text-slate-900">Offline</span>
                </>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-1">{mlHealth?.config?.model || 'Model Loading...'}</p>
          </div>
          <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
            <Cpu className="w-6 h-6" />
          </div>
        </div>

        {/* Job Data Health */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-slate-500 text-xs font-semibold uppercase tracking-wide">Job Market Database</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">{jobStatus?.embeddings?.totalJobs?.toLocaleString() || 0}</p>
            <p className="text-xs text-emerald-600 flex items-center mt-1">
              <CheckCircle className="w-3 h-3 mr-1" /> 
              {jobStatus?.embeddings?.coveragePercentage}% Vectorized
            </p>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg">
            <Database className="w-6 h-6" />
          </div>
        </div>

        {/* Curriculum Data Health */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-slate-500 text-xs font-semibold uppercase tracking-wide">Active Curricula</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">{currStatus?.embeddings?.totalCurricula?.toLocaleString() || 0}</p>
            <p className="text-xs text-purple-600 flex items-center mt-1">
              <CheckCircle className="w-3 h-3 mr-1" /> 
              {currStatus?.embeddings?.coveragePercentage}% Analyzed
            </p>
          </div>
          <div className="p-3 bg-purple-50 text-purple-600 rounded-lg">
            <BookOpen className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* 2. Action Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Data Ingestion Panel */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
            <h3 className="font-bold text-slate-800 flex items-center">
              <DownloadCloud className="w-5 h-5 mr-2 text-blue-600" />
              Adzuna Data Ingestion
            </h3>
            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full font-medium">Live API</span>
          </div>
          <div className="p-6">
            <p className="text-sm text-slate-600 mb-4">
              Fetch the latest job postings from Adzuna API to keep the market data fresh.
            </p>
            
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase">Countries</label>
                <input 
                  type="text" 
                  value={ingestConfig.countries.join(',')}
                  onChange={(e) => setIngestConfig({...ingestConfig, countries: e.target.value.split(',')})}
                  className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase">Limit per Category</label>
                <input 
                  type="number" 
                  value={ingestConfig.resultsPerCategory}
                  onChange={(e) => setIngestConfig({...ingestConfig, resultsPerCategory: parseInt(e.target.value)})}
                  className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm"
                />
              </div>
            </div>

            <button 
              onClick={handleBulkIngest}
              disabled={ingesting}
              className="w-full flex items-center justify-center px-4 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-lg transition-colors disabled:opacity-50"
            >
              {ingesting ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> 
                  Ingesting Data...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 mr-2 fill-current" />
                  Start Data Pipeline
                </>
              )}
            </button>
          </div>
        </div>

        {/* ML Operations Panel */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
            <h3 className="font-bold text-slate-800 flex items-center">
              <Activity className="w-5 h-5 mr-2 text-purple-600" />
              Vector Embeddings
            </h3>
            <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded-full font-medium">Queue: Active</span>
          </div>
          <div className="p-6 space-y-4">
            {/* Job Embeddings Control */}
            <div className="flex items-center justify-between p-4 border border-slate-100 rounded-lg bg-slate-50">
              <div>
                <h4 className="font-semibold text-slate-900">Job Embeddings</h4>
                <p className="text-xs text-slate-500">
                  Missing: {((jobStatus?.embeddings?.totalJobs || 0) - (jobStatus?.embeddings?.jobsWithEmbeddings || 0)).toLocaleString()} jobs
                </p>
              </div>
              <button 
                onClick={handleGenerateJobEmbeddings}
                disabled={embeddingJobs}
                className="px-3 py-2 bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-md text-sm font-medium shadow-sm disabled:opacity-50"
              >
                {embeddingJobs ? 'Processing...' : 'Generate Missing'}
              </button>
            </div>

            {/* Curriculum Embeddings Control */}
            <div className="flex items-center justify-between p-4 border border-slate-100 rounded-lg bg-slate-50">
              <div>
                <h4 className="font-semibold text-slate-900">Curriculum Embeddings</h4>
                <p className="text-xs text-slate-500">
                  Force regenerate all curriculum vectors
                </p>
              </div>
              <button 
                 onClick={handleGenerateCurrEmbeddings}
                 disabled={embeddingCurr}
                 className="px-3 py-2 bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-md text-sm font-medium shadow-sm disabled:opacity-50"
              >
                {embeddingCurr ? 'Processing...' : 'Regenerate All'}
              </button>
            </div>
          </div>
        </div>

      </div>
    </PageLayout>
  );
}

// Icon helper for the card
function BookOpen(props) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
    </svg>
  );
}