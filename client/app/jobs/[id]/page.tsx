'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { jobsAPI } from '@/lib/api';
import { getStoredUser } from '@/lib/auth';

type Job = {
  _id: string;
  title: string;
  description: string;
  category: string;
  budget: number;
};

const JobDetailPage: React.FC = () => {
  const params = useParams();
  const router = useRouter();
  const id = Array.isArray(params?.id) ? params.id[0] : (params?.id as string);
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const user = getStoredUser();

  useEffect(() => {
    (async () => {
      if (!id) return;
      try {
        const res = await jobsAPI.getById(id);
        const j = res.data?.data || res.data?.job || res.data;
        setJob({
          _id: j._id,
          title: j.title,
          description: j.description,
          category: j.category,
          budget: j.budget,
        } as Job);
  } catch {
        setJob(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  if (loading) return <div className="p-8">Loading...</div>;
  if (!job) return <div className="p-8">Job not found.</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">{job.title}</h1>
          <p className="text-gray-600 mb-4">{job.description}</p>
          <div className="text-sm text-gray-500 mb-4">Category: {job.category} • Budget: ETB {job.budget}</div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => router.push('/jobs')}>Back to Jobs</Button>
            {user?.role === 'worker' && (
              <Button onClick={() => router.push(`/jobs/${job._id}/apply`)}>Apply Now</Button>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default JobDetailPage;
