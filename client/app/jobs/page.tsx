'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, Filter, MapPin, Clock, DollarSign, Briefcase } from 'lucide-react';
import { getStoredUser } from '@/lib/auth';
import { jobsAPI } from '@/lib/api';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Card from '@/components/ui/Card';

const JobsPage: React.FC = () => {
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [budgetRange, setBudgetRange] = useState({ min: '', max: '' });
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const currentUser = getStoredUser();
    setUser(currentUser);
    fetchJobs();
  }, []);

  const fetchJobs = async (filters: any = {}) => {
    try {
      setLoading(true);
      const response = await jobsAPI.getAll({
        status: 'open',
        ...filters,
      });
      setJobs(response.data.jobs || []);
    } catch (error) {
      console.error('Failed to fetch jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    const filters: any = {};
    if (searchQuery) filters.search = searchQuery;
    if (categoryFilter) filters.category = categoryFilter;
    if (locationFilter) filters.location = locationFilter;
    if (budgetRange.min) filters.minBudget = parseFloat(budgetRange.min);
    if (budgetRange.max) filters.maxBudget = parseFloat(budgetRange.max);

    fetchJobs(filters);
  };

  const clearFilters = () => {
    setSearchQuery('');
    setCategoryFilter('');
    setLocationFilter('');
    setBudgetRange({ min: '', max: '' });
    fetchJobs();
  };

  const categories = [
    'Web Development',
    'Mobile Development',
    'Design',
    'Writing',
    'Marketing',
    'Data Entry',
    'Customer Service',
    'Sales',
    'Consulting',
    'Other'
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Browse Jobs</h1>
          <p className="text-gray-600 mt-2">Find the perfect opportunity for your skills</p>
        </div>

        {/* Search and Filters */}
        <Card className="mb-8">
          <div className="space-y-4">
            {/* Search Bar */}
            <div className="flex items-center space-x-4">
              <div className="flex-1">
                <Input
                  placeholder="Search jobs by title, description, or skills..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Button onClick={handleSearch}>
                <Search className="h-4 w-4 mr-2" />
                Search
              </Button>
            </div>

            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category
                </label>
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">All Categories</option>
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>

              <Input
                label="Location"
                placeholder="Enter location"
                value={locationFilter}
                onChange={(e) => setLocationFilter(e.target.value)}
              />

              <Input
                label="Min Budget (ETB)"
                type="number"
                placeholder="0"
                value={budgetRange.min}
                onChange={(e) => setBudgetRange({ ...budgetRange, min: e.target.value })}
              />

              <Input
                label="Max Budget (ETB)"
                type="number"
                placeholder="100000"
                value={budgetRange.max}
                onChange={(e) => setBudgetRange({ ...budgetRange, max: e.target.value })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Button variant="outline" onClick={handleSearch}>
                  <Filter className="h-4 w-4 mr-2" />
                  Apply Filters
                </Button>
                <Button variant="ghost" onClick={clearFilters}>
                  Clear Filters
                </Button>
              </div>
              <p className="text-sm text-gray-500">
                {jobs.length} job{jobs.length !== 1 ? 's' : ''} found
              </p>
            </div>
          </div>
        </Card>

        {/* Jobs List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
          </div>
        ) : jobs.length > 0 ? (
          <div className="space-y-4">
            {jobs.map((job) => (
              <Card key={job._id} className="hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">
                          {job.title}
                        </h3>
                        <div className="flex items-center space-x-4 text-sm text-gray-500 mb-3">
                          <div className="flex items-center">
                            <Briefcase className="h-4 w-4 mr-1" />
                            {job.category}
                          </div>
                          {job.location && (
                            <div className="flex items-center">
                              <MapPin className="h-4 w-4 mr-1" />
                              {job.location}
                            </div>
                          )}
                          <div className="flex items-center">
                            <Clock className="h-4 w-4 mr-1" />
                            Due: {new Date(job.deadline).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center text-green-600 font-bold text-xl mb-2">
                          <DollarSign className="h-5 w-5" />
                          ETB {job.budget?.toLocaleString()}
                        </div>
                        <span className={`px-3 py-1 text-sm rounded-full ${
                          job.priority === 'urgent' ? 'bg-red-100 text-red-800' :
                          job.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                          job.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {job.priority} priority
                        </span>
                      </div>
                    </div>

                    <p className="text-gray-600 mb-4 line-clamp-3">
                      {job.description}
                    </p>

                    {/* Skills */}
                    {job.skills && job.skills.length > 0 && (
                      <div className="mb-4">
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Required Skills:</h4>
                        <div className="flex flex-wrap gap-2">
                          {job.skills.slice(0, 5).map((skill: string, index: number) => (
                            <span
                              key={index}
                              className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                            >
                              {skill}
                            </span>
                          ))}
                          {job.skills.length > 5 && (
                            <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                              +{job.skills.length - 5} more
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <span>Posted {new Date(job.createdAt).toLocaleDateString()}</span>
                        <span>•</span>
                        <span>{job.applications?.length || 0} applications</span>
                        <span>•</span>
                        <span className="capitalize">{job.workType}</span>
                      </div>
                      <div className="flex space-x-2">
                        <Link href={`/jobs/${job._id}`}>
                          <Button variant="outline" size="sm">
                            View Details
                          </Button>
                        </Link>
                        {user && user.role === 'worker' && (
                          <Link href={`/jobs/${job._id}/apply`}>
                            <Button size="sm">
                              Apply Now
                            </Button>
                          </Link>
                        )}
                        {!user && (
                          <Link href="/login">
                            <Button size="sm">
                              Login to Apply
                            </Button>
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="text-center py-12">
            <Briefcase className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No jobs found</h3>
            <p className="text-gray-600 mb-4">
              Try adjusting your search criteria or check back later for new opportunities.
            </p>
            <Button variant="outline" onClick={clearFilters}>
              Clear All Filters
            </Button>
          </Card>
        )}
      </div>
    </div>
  );
};

export default JobsPage;
