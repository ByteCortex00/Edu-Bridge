import { useEffect, useState } from 'react';
import { jobsAPI } from '../api/jobs';
import { Briefcase, Search, MapPin, DollarSign, Calendar } from 'lucide-react';
import { format } from 'date-fns';

export function Jobs() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterCountry, setFilterCountry] = useState('all');
  const [categories, setCategories] = useState([]);
  const [countries, setCountries] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const pageSize = 12;

  useEffect(() => {
    loadJobs();
  }, [page, filterCategory, filterCountry]);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadJobs = async () => {
    setLoading(true);
    try {
      const params = {
        page,
        limit: pageSize,
        sortBy: 'postedDate',
        sortOrder: 'desc'
      };

      if (filterCategory !== 'all') {
        params.category = filterCategory;
      }

      if (filterCountry !== 'all') {
        params.country = filterCountry;
      }

      const response = await jobsAPI.getAll(params);
      if (response.success) {
        setJobs(response.data);
        setTotalPages(response.pagination.totalPages);
      }
    } catch (error) {
      console.error('Error loading jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const response = await jobsAPI.getCategories();
      if (response.success) {
        setCategories(response.data.categories);
      }
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const filteredJobs = jobs.filter(
    (job) =>
      job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.company.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading && page === 1) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Job Market</h1>
        <p className="text-gray-600 mt-1">Explore current job postings and trends</p>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search jobs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex flex-wrap gap-4">
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-gray-700">Category:</label>
            <select
              value={filterCategory}
              onChange={(e) => {
                setFilterCategory(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Categories</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-gray-700">Country:</label>
            <select
              value={filterCountry}
              onChange={(e) => {
                setFilterCountry(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Countries</option>
              {countries.map((country) => (
                <option key={country} value={country}>
                  {country}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredJobs.map((job) => (
          <div
            key={job._id}
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-1">{job.title}</h3>
                <p className="text-gray-600 font-medium">{job.company}</p>
              </div>
              <div className="bg-amber-100 p-3 rounded-lg">
                <Briefcase className="w-5 h-5 text-amber-600" />
              </div>
            </div>

            <div className="space-y-2 text-sm mb-4">
              <div className="flex items-center text-gray-600">
                <MapPin className="w-4 h-4 mr-2" />
                {job.location.city}, {job.location.country}
              </div>
              {job.salaryMin && (
                <div className="flex items-center text-gray-600">
                  <DollarSign className="w-4 h-4 mr-2" />
                  {job.salaryMax 
                    ? `$${job.salaryMin.toLocaleString()} - $${job.salaryMax.toLocaleString()}`
                    : `From $${job.salaryMin.toLocaleString()}`
                  }
                </div>
              )}
              <div className="flex items-center text-gray-600">
                <Calendar className="w-4 h-4 mr-2" />
                {format(new Date(job.postedDate), 'MMM d, yyyy')}
              </div>
              <div className="flex items-center">
                <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded">
                  {job.category}
                </span>
              </div>
            </div>

            <p className="text-sm text-gray-600 line-clamp-2">{job.description}</p>
          </div>
        ))}
      </div>

      {filteredJobs.length === 0 && (
        <div className="text-center py-12">
          <Briefcase className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No jobs found</h3>
          <p className="text-gray-600">Try adjusting your search criteria</p>
        </div>
      )}

      {!loading && jobs.length > 0 && (
        <div className="flex justify-center space-x-4">
          <button
            onClick={() => setPage(page - 1)}
            disabled={page === 1}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 disabled:opacity-50"
          >
            Previous
          </button>
          <span className="px-4 py-2 text-gray-700">Page {page} of {totalPages}</span>
          <button
            onClick={() => setPage(page + 1)}
            disabled={page >= totalPages}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}