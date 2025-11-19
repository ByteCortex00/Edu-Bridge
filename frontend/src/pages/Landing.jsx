import { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';
import { TrendingUp, BookOpen, Briefcase, Target, ArrowRight, BarChart3, Users, Zap } from 'lucide-react'; // Removed unused CheckCircle

export function Landing() {
  const { isSignedIn, isLoaded } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      navigate('/app');
    }
  }, [isSignedIn, isLoaded, navigate]);

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    // ✅ FIXED: Added h-screen and overflow-y-auto to enable scrolling
    <div className="h-screen w-full overflow-y-auto bg-white scroll-smooth">
      
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <TrendingUp className="w-8 h-8 text-blue-600" />
              <span className="ml-2 text-xl font-bold text-gray-900">EduBridge</span>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                to="/sign-in"
                className="text-gray-900 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Sign In
              </Link>
              <Link
                to="/sign-up"
                className="bg-slate-900 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-slate-800 transition-colors shadow-lg shadow-slate-900/20"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section
        className="relative bg-slate-900 min-h-[70vh] flex items-center"
      >
        {/* Abstract Background Pattern */}
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#4f46e5_1px,transparent_1px)] [background-size:16px_16px]"></div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 tracking-tight">
            Bridge the Gap Between
            <span className="text-blue-400 block mt-2">Education & Industry</span>
          </h1>
          <p className="text-xl text-slate-300 mb-10 max-w-3xl mx-auto leading-relaxed">
            Use AI-driven insights to align your university curricula with real-time job market demands. Ensure your students graduate with the skills employers actually want.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/sign-up"
              className="bg-blue-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-blue-500 transition-all shadow-xl shadow-blue-900/20 flex items-center justify-center group"
            >
              Start Free Analysis
              <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <a
              href="#features"
              className="px-8 py-4 rounded-lg text-lg font-semibold text-white border border-slate-700 hover:bg-slate-800 transition-all"
            >
              How it Works
            </a>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <span className="text-blue-600 font-semibold text-sm uppercase tracking-wider">Why EduBridge?</span>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mt-3 mb-4">Data-Driven Curriculum Design</h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Stop guessing what skills are trending. Let our AI analyze millions of job postings to give you concrete evidence.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <FeatureCard 
              icon={<Target className="w-6 h-6 text-blue-600" />}
              title="Precision Gap Analysis"
              desc="Upload your course syllabus and instantly see which skills are missing compared to live job descriptions."
            />
            <FeatureCard 
              icon={<BarChart3 className="w-6 h-6 text-green-600" />}
              title="Market Trend Forecasting"
              desc="Identify emerging technologies and methodologies before they become industry standards."
            />
            <FeatureCard 
              icon={<Briefcase className="w-6 h-6 text-purple-600" />}
              title="Employability Metrics"
              desc="Score your programs based on 'Hireability' and give your students a competitive edge."
            />
            <FeatureCard 
              icon={<BookOpen className="w-6 h-6 text-yellow-600" />}
              title="Automated Course Mapping"
              desc="Our AI maps learning outcomes to standardized skill taxonomies automatically."
            />
            <FeatureCard 
              icon={<Users className="w-6 h-6 text-red-600" />}
              title="Employer Alignment"
              desc="Generate reports to show industry partners how your graduates meet their specific needs."
            />
            <FeatureCard 
              icon={<Zap className="w-6 h-6 text-indigo-600" />}
              title="Real-time Data"
              desc="We scrape and analyze job boards daily so your curriculum never falls behind."
            />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-12 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center">
          <div className="flex items-center mb-4 md:mb-0">
            <TrendingUp className="w-6 h-6 text-blue-500" />
            <span className="ml-2 text-lg font-bold text-white">EduBridge</span>
          </div>
          <div className="text-sm">
            © 2025 EduBridge Analytics. Built for Higher Education.
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, desc }) {
  return (
    <div className="bg-slate-50 p-8 rounded-2xl border border-slate-100 hover:border-blue-100 hover:shadow-lg transition-all duration-300 group">
      <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center mb-6 shadow-sm group-hover:scale-110 transition-transform">
        {icon}
      </div>
      <h3 className="text-xl font-bold text-slate-900 mb-3">{title}</h3>
      <p className="text-slate-600 leading-relaxed">
        {desc}
      </p>
    </div>
  );
}