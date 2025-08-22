'use client';

import React, { useState, useEffect } from 'react';
import { jobsAPI } from '@/lib/api';

interface Job {
  title: string;
}

interface JobsApiResult {
  success: boolean;
  count: number;
  total: number;
  data: Job[];
}

const TestAPIPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<JobsApiResult | null>(null);

  const testAPI = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log('Testing API connection...');
      const response = await jobsAPI.getAll({ status: 'posted' });
      console.log('API Response:', response);
      setResult(response.data as JobsApiResult);
    } catch (err: unknown) {
      console.error('API Error:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    testAPI();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">API Connection Test</h1>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Test Results</h2>

          {loading && <div className="text-blue-600">Loading...</div>}

          {error && (
            <div className="text-red-600 mb-4">
              <strong>Error:</strong> {error}
            </div>
          )}

          {result && (
            <div className="space-y-4">
              <div>
                <strong>Success:</strong> {result.success ? 'Yes' : 'No'}
              </div>
              <div>
                <strong>Count:</strong> {result.count}
              </div>
              <div>
                <strong>Jobs Found:</strong> {result.data?.length || 0}
              </div>

              {result.data && result.data.length > 0 && (
                <div>
                  <strong>Job Titles:</strong>
                  <ul className="list-disc list-inside mt-2">
                    {result.data.map((job: Job, index: number) => (
                      <li key={index}>{job.title}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        <button
          onClick={testAPI}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Test Again
        </button>
      </div>
    </div>
  );
};

export default TestAPIPage;
