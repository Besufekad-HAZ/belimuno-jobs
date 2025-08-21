'use client';

import React, { useEffect, useState } from 'react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { adminAPI } from '@/lib/api';
import { Shield, Filter, CheckCircle2, XCircle, Eye } from 'lucide-react';

type ReviewItem = {
  _id: string;
  reviewType: 'client_to_worker'|'worker_to_client';
  rating: number;
  comment?: string;
  status: 'draft'|'published'|'hidden';
  moderationStatus: 'pending'|'approved'|'rejected';
  reviewer?: { name?: string; role?: string };
  reviewee?: { name?: string; role?: string };
  job?: { title?: string };
  createdAt?: string;
};

const AdminReviewsPage: React.FC = () => {
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<{ moderationStatus?: string; status?: string }>({ moderationStatus: 'pending' });

  const load = async () => {
    try {
      setLoading(true);
      const res = await adminAPI.getReviews(filter);
      setReviews(res.data?.data || []);
    } catch (e) {
      console.error(e);
      setReviews([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [filter]);

  const moderate = async (id: string, moderationStatus: 'approved'|'rejected') => {
    await adminAPI.moderateReview(id, { moderationStatus, status: moderationStatus==='approved' ? 'published' : 'hidden' });
    load();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center"><Shield className="h-7 w-7 text-blue-600 mr-2"/>Reviews Moderation</h1>
          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-gray-500"/>
            <select value={filter.moderationStatus || ''} onChange={e=>setFilter({ ...filter, moderationStatus: e.target.value || undefined })} className="px-2 py-1 border rounded">
              <option value="">All</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
            <select value={filter.status || ''} onChange={e=>setFilter({ ...filter, status: e.target.value || undefined })} className="px-2 py-1 border rounded">
              <option value="">Any Status</option>
              <option value="published">Published</option>
              <option value="hidden">Hidden</option>
              <option value="draft">Draft</option>
            </select>
            <Button variant="outline" onClick={load}>Refresh</Button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">Loading...</div>
        ) : (
          <div className="space-y-3">
            {reviews.map((r) => (
              <Card key={r._id} className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1 pr-4">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="text-xs px-2 py-1 rounded bg-gray-100 text-gray-700">{r.reviewType.replace('_',' → ')}</span>
                      <span className={`text-xs px-2 py-1 rounded ${r.moderationStatus==='pending'?'bg-yellow-100 text-yellow-800':r.moderationStatus==='approved'?'bg-green-100 text-green-800':'bg-red-100 text-red-800'}`}>{r.moderationStatus}</span>
                      <span className={`text-xs px-2 py-1 rounded ${r.status==='published'?'bg-blue-100 text-blue-800':'bg-gray-100 text-gray-700'}`}>{r.status}</span>
                      <span className="text-xs text-gray-400">{r.createdAt ? new Date(r.createdAt).toLocaleString() : ''}</span>
                    </div>
                    <div className="text-sm text-gray-700 mb-2">Job: <span className="font-medium">{r.job?.title || '—'}</span></div>
                    <div className="text-sm text-gray-700">Reviewer: <span className="font-medium">{r.reviewer?.name}</span> ({r.reviewer?.role})</div>
                    <div className="text-sm text-gray-700">Reviewee: <span className="font-medium">{r.reviewee?.name}</span> ({r.reviewee?.role})</div>
                    <div className="mt-2">
                      <div className="flex items-center space-x-1 text-yellow-400">
                        {Array.from({length:5}).map((_,i)=> (
                          <span key={i}>{i < (r.rating||0) ? '★' : '☆'}</span>
                        ))}
                      </div>
                      <p className="text-gray-800 mt-1 whitespace-pre-wrap">{r.comment || '—'}</p>
                    </div>
                  </div>
                  <div className="flex flex-col space-y-2 w-48">
                    <Button variant="outline" onClick={()=>moderate(r._id, 'approved')}>
                      <CheckCircle2 className="h-4 w-4 mr-1"/> Approve
                    </Button>
                    <Button variant="outline" onClick={()=>moderate(r._id, 'rejected')}>
                      <XCircle className="h-4 w-4 mr-1"/> Reject
                    </Button>
                    <Button variant="ghost">
                      <Eye className="h-4 w-4 mr-1"/> View Job
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
            {reviews.length === 0 && (
              <Card className="p-12 text-center text-gray-500">No reviews found for selected filters.</Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminReviewsPage;


