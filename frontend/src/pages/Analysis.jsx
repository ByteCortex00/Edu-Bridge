import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { analyticsAPI } from '../api/analytics';
import { curriculaAPI } from '../api/curricula';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, BookOpen, AlertCircle } from 'lucide-react';

export function Analysis() {
  const { id } = useParams();
  const [curriculum, setCurriculum] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadCurriculum();
    loadLatestAnalysis();
  }, [id]);

  const loadCurriculum = async () => {
    try {
      const response = await curriculaAPI.getById(id);
      if (response.success) {
        console.log('Loaded curriculum:', response.data);
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
        setAnalysis(response.data);
      }
    } catch (err) {
      // No previous analysis, that's fine
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
        setAnalysis(response.data);
      } else {
        setError(response.message || 'Analysis failed');
      }
    } catch (err) {
      setError(err.message || 'Analysis failed');
    } finally {
      setAnalyzing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!curriculum) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Curriculum not found</h3>
        <p className="text-gray-600">The requested curriculum could not be loaded.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Skills Gap Analysis</h1>
        <p className="text-gray-600 mt-1">Analyzing curriculum: {curriculum.programName || 'Unknown'}</p>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <BookOpen className="w-6 h-6 text-blue-600" />
            <div>
              <h2 className="text-lg font-semibold text-gray-900">{curriculum.programName || 'Unknown Curriculum'}</h2>
              <p className="text-sm text-gray-600">{curriculum.department || 'N/A'} • {curriculum.degree || 'N/A'}</p>
            </div>
          </div>
          <button
            onClick={runAnalysis}
            disabled={analyzing}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <TrendingUp className="w-4 h-4 mr-2" />
            {analyzing ? 'Analyzing...' : 'Run Analysis'}
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {analysis ? (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Skills Gap Results</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{analysis.matchedSkills || 0}</div>
                  <div className="text-sm text-green-700">Matched Skills</div>
                </div>
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-yellow-600">{analysis.gapSkills || 0}</div>
                  <div className="text-sm text-yellow-700">Skills Gap</div>
                </div>
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{analysis.coverage || 0}%</div>
                  <div className="text-sm text-blue-700">Coverage</div>
                </div>
              </div>
            </div>

            {analysis.gapAnalysis && analysis.gapAnalysis.length > 0 && (
              <div>
                <h4 className="text-md font-semibold text-gray-900 mb-4">Gap Analysis Details</h4>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={analysis.gapAnalysis}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="skill" angle={-45} textAnchor="end" height={100} />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="gap" fill="#ef4444" name="Gap" />
                    <Bar dataKey="demand" fill="#3b82f6" name="Demand" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {analysis.recommendations && analysis.recommendations.length > 0 && (
              <div>
                <h4 className="text-md font-semibold text-gray-900 mb-4">Recommendations</h4>
                <div className="space-y-2">
                  {analysis.recommendations.map((rec, index) => (
                    <div key={index} className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-sm text-gray-700">{typeof rec === 'string' ? rec : rec.description || JSON.stringify(rec)}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-12">
            <TrendingUp className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Analysis Available</h3>
            <p className="text-gray-600 mb-4">Click "Run Analysis" to generate skills gap insights for this curriculum.</p>
          </div>
        )}
      </div>
    </div>
  );
}