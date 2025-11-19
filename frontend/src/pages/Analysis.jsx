import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAnalyticsAPI } from '../api/analytics';
import { useCurriculaAPI } from '../api/curricula';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, BookOpen, AlertCircle, CheckCircle, AlertTriangle } from 'lucide-react';
import { PageLayout } from '../components/layout/PageLayout'; // ✅ Import PageLayout

export function Analysis() {
  const { id } = useParams();
  const [curriculum, setCurriculum] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState('');
  const analyticsAPI = useAnalyticsAPI();
  const curriculaAPI = useCurriculaAPI();

  useEffect(() => {
    loadCurriculum();
    loadLatestAnalysis();
  }, [id]);

  const loadCurriculum = async () => {
    try {
      const response = await curriculaAPI.getById(id);
      if (response.success) {
        setCurriculum(response.data);
      }
    } catch (err) {
      console.error('Error loading curriculum:', err);
    }
  };

  const loadLatestAnalysis = async () => {
    try {
      const response = await analyticsAPI.getLatest(id);
      if (response.success) {
        const backendData = response.data;
        const transformedData = {
          matchedSkills: backendData.metrics?.wellCoveredSkills?.length || 0,
          gapSkills: backendData.metrics?.criticalGaps?.length || 0,
          coverage: backendData.metrics?.overallMatchRate || 0,
          gapAnalysis: backendData.metrics?.criticalGaps?.map(gap => ({
            skill: gap.skillName,
            gap: gap.demandFrequency,
            demand: gap.demandFrequency
          })) || [],
          recommendations: backendData.recommendations?.map(rec => rec.description) || []
        };
        setAnalysis(transformedData);
      }
    } catch (err) {
      // No previous analysis found, totally fine
    } finally {
      setLoading(false);
    }
  };

  const runAnalysis = async () => {
    setAnalyzing(true);
    setError('');
    try {
      const response = await analyticsAPI.analyzeGap(id, {
        includeRecommendations: true,
        detailed: true
      });

      if (response.success) {
        const backendData = response.data;
        const transformedData = {
          matchedSkills: backendData.metrics?.wellCoveredSkills?.length || 0,
          gapSkills: backendData.metrics?.criticalGaps?.length || 0,
          coverage: backendData.metrics?.overallMatchRate || 0,
          gapAnalysis: backendData.metrics?.criticalGaps?.map(gap => ({
            skill: gap.skillName,
            gap: gap.demandFrequency,
            demand: gap.demandFrequency
          })) || [],
          recommendations: backendData.recommendations?.map(rec => rec.description) || []
        };
        setAnalysis(transformedData);
      } else {
        setError(response.message || 'Analysis failed');
      }
    } catch (err) {
      setError(err.message || 'Analysis failed');
    } finally {
      setAnalyzing(false);
    }
  };

  // 1. Header Action Button (Moved to Fixed Header)
  const headerAction = (
    <button
      onClick={runAnalysis}
      disabled={analyzing}
      className="flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm shadow-blue-200"
    >
      {analyzing ? (
        <>
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
          Analyzing...
        </>
      ) : (
        <>
          <TrendingUp className="w-4 h-4 mr-2" />
          Run New Analysis
        </>
      )}
    </button>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-400 text-sm">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mr-3"></div>
        Loading analysis data...
      </div>
    );
  }

  if (!curriculum) {
    return (
      <PageLayout title="Analysis Not Found">
        <div className="text-center py-12 bg-white rounded-xl border border-slate-200">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-slate-900 mb-1">Curriculum not found</h3>
          <p className="text-slate-500">The requested curriculum could not be loaded.</p>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout
      title="Skills Gap Analysis"
      description={`Analyzing: ${curriculum.programName} (${curriculum.degree})`}
      headerContent={headerAction}
    >
      {/* Error Banner */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center">
          <AlertCircle className="w-5 h-5 mr-2" />
          {error}
        </div>
      )}

      {analysis ? (
        <div className="space-y-6">
          {/* 1. Top Metrics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Matched Skills</h4>
                <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg">
                  <CheckCircle className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-bold text-slate-900">{analysis.matchedSkills || 0}</div>
              <p className="text-xs text-emerald-600 font-medium mt-1">Aligned with market</p>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Skills Gap</h4>
                <div className="p-1.5 bg-amber-50 text-amber-600 rounded-lg">
                  <AlertTriangle className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-bold text-slate-900">{analysis.gapSkills || 0}</div>
              <p className="text-xs text-amber-600 font-medium mt-1">Missing critical skills</p>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Market Coverage</h4>
                <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
                  <BookOpen className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-bold text-slate-900">{analysis.coverage || 0}%</div>
              <p className="text-xs text-blue-600 font-medium mt-1">Relevance score</p>
            </div>
          </div>

          {/* 2. Main Chart & Recommendations Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Chart Section */}
            {analysis.gapAnalysis && analysis.gapAnalysis.length > 0 && (
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <h4 className="text-base font-bold text-slate-900 mb-6">Top Critical Gaps</h4>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={analysis.gapAnalysis} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis 
                        dataKey="skill" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{fill: '#64748b', fontSize: 11}} 
                        dy={10}
                        interval={0}
                        angle={-25}
                        textAnchor="end"
                        height={60}
                      />
                      <YAxis 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{fill: '#64748b', fontSize: 11}} 
                      />
                      <Tooltip 
                        cursor={{fill: '#f1f5f9'}}
                        contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                      />
                      <Bar dataKey="gap" fill="#ef4444" radius={[4, 4, 0, 0]} name="Gap Score" barSize={32} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* Recommendations Section */}
            {analysis.recommendations && analysis.recommendations.length > 0 && (
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col">
                <h4 className="text-base font-bold text-slate-900 mb-4">AI Recommendations</h4>
                <div className="flex-1 overflow-y-auto pr-2 space-y-3 max-h-[300px]">
                  {analysis.recommendations.map((rec, index) => (
                    <div key={index} className="flex items-start p-3 bg-slate-50 rounded-lg border border-slate-100">
                      <div className="min-w-[6px] h-1.5 w-1.5 mt-2 rounded-full bg-blue-500 mr-3"></div>
                      <p className="text-sm text-slate-700 leading-relaxed">
                        {typeof rec === 'string' ? rec : rec.description || JSON.stringify(rec)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Empty State */
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-xl border border-slate-200 border-dashed">
          <div className="p-4 bg-slate-50 rounded-full mb-4">
            <TrendingUp className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 mb-1">No Analysis Data</h3>
          <p className="text-slate-500 text-sm max-w-md text-center mb-6">
            Run your first analysis to generate AI-driven insights, identify skill gaps, and get curriculum recommendations.
          </p>
          <button
            onClick={runAnalysis}
            disabled={analyzing}
            className="px-5 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
          >
            {analyzing ? 'Processing...' : 'Start Analysis'}
          </button>
        </div>
      )}
    </PageLayout>
  );
}