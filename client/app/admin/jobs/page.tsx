'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getStoredUser, hasRole } from '@/lib/auth';
import { adminAPI } from '@/lib/api';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import { Search, Filter, RefreshCw, Eye, Briefcase, Download, Plus, Trash2, Pencil, X, Calendar } from 'lucide-react';

type AdminJob = {
  _id: string;
  title: string;
  category?: string;
  budget?: number;
  status: 'draft' | 'posted' | 'in_progress' | 'completed' | 'cancelled';
  createdAt: string;
  deadline?: string;
  applicationsCount?: number;
  client?: { name?: string };
};

const statusChips: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-800',
  posted: 'bg-green-100 text-green-800',
  in_progress: 'bg-blue-100 text-blue-800',
  completed: 'bg-purple-100 text-purple-800',
  cancelled: 'bg-red-100 text-red-800',
};

const ManageJobsPage: React.FC = () => {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<string>('all');
  const [range, setRange] = useState<'30d' | '90d' | 'all'>('30d');
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState<AdminJob | null>(null);
  const [showDelete, setShowDelete] = useState<{ id: string; title: string } | null>(null);
  const [jobs, setJobs] = useState<AdminJob[]>([]);

  useEffect(() => {
    const user = getStoredUser();
    if (!user || !hasRole(user, ['super_admin', 'admin_hr', 'admin_outsource'])) {
      router.push('/login');
      return;
    }

    fetchJobs();
  }, [router]);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const res = await adminAPI.getAllJobs();
      setJobs(res.data.data || []);
    } catch (e) {
      console.error('Failed to load jobs', e);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    setShowDelete(null);
    await adminAPI.deleteJob(id);
    await fetchJobs();
  };

  const upsertJob = async (form: Partial<AdminJob>) => {
    if (editing) {
      await adminAPI.updateJob(editing._id, form);
    } else {
      await adminAPI.createJob(form);
    }
    setShowCreate(false);
    setEditing(null);
    await fetchJobs();
  };

  const filtered = useMemo(() => {
    const cutoff = new Date();
    if (range === '30d') cutoff.setDate(cutoff.getDate() - 30);
    if (range === '90d') cutoff.setDate(cutoff.getDate() - 90);

    return jobs
      .filter((j) => (status === 'all' ? true : j.status === status))
      .filter((j) => (range === 'all' ? true : new Date(j.createdAt) >= cutoff))
      .filter((j) =>
        query.trim()
          ? [j.title, j.category, j.client?.name]
              .filter(Boolean)
              .join(' ')
              .toLowerCase()
              .includes(query.toLowerCase())
          : true
      );
  }, [jobs, query, status, range]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-2 border-blue-600 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header / Toolbar */}
        <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Manage Jobs</h1>
            <p className="text-gray-600">Search, review, and update job postings across the platform.</p>
          </div>
          <div className="flex gap-2 self-start md:self-auto">
            <Button variant="outline" onClick={fetchJobs}>
              <RefreshCw className="h-4 w-4 mr-2" /> Refresh
            </Button>
            <Button variant="outline" onClick={() => window.print()}>
              <Download className="h-4 w-4 mr-2" /> Export
            </Button>
            <Button onClick={() => { setEditing(null); setShowCreate(true); }}>
              <Plus className="h-4 w-4 mr-2" /> New Job
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Card className="mb-6 p-4">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 items-end">
            <div className="relative">
              <Search className="h-4 w-4 absolute left-3 top-3.5 text-gray-400" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by title, client, category"
                className="w-full pl-9 pr-9 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900"
              />
              {query && (
                <button aria-label="Clear" onClick={() => setQuery('')} className="absolute right-2 top-2.5 h-7 w-7 inline-flex items-center justify-center rounded hover:bg-gray-100">
                  <X className="h-4 w-4 text-gray-500" />
                </button>
              )}
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900"
              >
                <option value="all">All</option>
                <option value="draft">Draft</option>
                <option value="posted">Posted</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Date Range</label>
              <div className="relative">
                <Calendar className="h-4 w-4 absolute left-3 top-3 text-gray-400" />
                <select
                  value={range}
                  onChange={(e) => setRange(e.target.value as '30d' | '90d' | 'all')}
                  className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900"
                >
                  <option value="30d">Last 30 days</option>
                  <option value="90d">Last 90 days</option>
                  <option value="all">All time</option>
                </select>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => { setQuery(''); setStatus('all'); setRange('30d'); }} className="w-full">
                <Filter className="h-4 w-4 mr-2" /> Reset Filters
              </Button>
            </div>
          </div>
        </Card>

        {/* Jobs Table */}
        <Card className="p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-[1000px] w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 sticky top-0 z-10">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Budget</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Posted</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-[220px]">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {filtered.map((job) => (
                  <tr key={job._id} className="hover:bg-gray-50/60">
                    <td className="px-6 py-4">
                      <div className="flex items-center min-w-0">
                        <div className="h-9 w-9 mr-3 flex items-center justify-center rounded bg-blue-50 text-blue-600">
                          <Briefcase className="h-4 w-4" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-sm font-medium text-gray-900 truncate max-w-[420px]">{job.title}</div>
                          {job.deadline && (
                            <div className="text-xs text-gray-500">Due {new Date(job.deadline).toLocaleDateString()}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{job.client?.name || '—'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{job.category || '—'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{job.budget ? `ETB ${job.budget.toLocaleString()}` : '—'}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs rounded-full ${statusChips[job.status]}`}>{job.status.replace('_', ' ')}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(job.createdAt).toLocaleDateString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex gap-2 justify-end">
                        <Button variant="outline" size="sm" onClick={() => router.push(`/jobs/${job._id}`)}>
                          <Eye className="h-4 w-4 mr-1" /> View
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => { setEditing(job); setShowCreate(true); }}>
                          <Pencil className="h-4 w-4 mr-1" /> Edit
                        </Button>
                        <Button variant="danger" size="sm" onClick={() => setShowDelete({ id: job._id, title: job.title })}>
                          <Trash2 className="h-4 w-4 mr-1" /> Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filtered.length === 0 && (
            <div className="p-10 text-center">
              <div className="mx-auto h-12 w-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mb-3">
                <Briefcase className="h-6 w-6" />
              </div>
              <p className="text-gray-700 font-medium">No jobs match your filters</p>
              <p className="text-sm text-gray-500 mt-1">Try adjusting filters or create a new job.</p>
              <div className="mt-4">
                <Button onClick={() => { setEditing(null); setShowCreate(true); }}>
                  <Plus className="h-4 w-4 mr-2" /> New Job
                </Button>
              </div>
            </div>
          )}
        </Card>

        {/* Create/Edit Modal */}
        <Modal isOpen={showCreate} onClose={() => { setShowCreate(false); setEditing(null); }} title={editing ? 'Edit Job' : 'Create Job'} size="lg">
          <div className="pt-2">
            <JobForm initial={editing || undefined} onCancel={() => { setShowCreate(false); setEditing(null); }} onSave={upsertJob} />
          </div>
        </Modal>

        {/* Delete Confirmation Modal */}
        <Modal isOpen={!!showDelete} onClose={() => setShowDelete(null)} title="Delete Job" size="sm">
          <div className="space-y-4">
            <p className="text-sm text-gray-700">Are you sure you want to delete the job
              <span className="font-semibold"> {showDelete?.title}</span>? This action cannot be undone.</p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowDelete(null)}>Cancel</Button>
              {showDelete && (
                <Button variant="danger" onClick={() => handleDelete(showDelete.id)}>
                  <Trash2 className="h-4 w-4 mr-2" /> Delete
                </Button>
              )}
            </div>
          </div>
        </Modal>
      </div>
    </div>
  );
};

type JobFormProps = {
  initial?: Partial<AdminJob>;
  onCancel: () => void;
  onSave: (form: Partial<AdminJob>) => Promise<void>;
};

const JobForm: React.FC<JobFormProps> = ({ initial, onCancel, onSave }) => {
  const [title, setTitle] = useState(initial?.title || '');
  const [category, setCategory] = useState(initial?.category || '');
  const [budget, setBudget] = useState<number | undefined>(initial?.budget);
  const [status, setStatus] = useState<AdminJob['status']>(initial?.status || 'posted');
  const [deadline, setDeadline] = useState<string>(initial?.deadline ? new Date(initial.deadline).toISOString().slice(0,10) : '');

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        await onSave({ title, category, budget, status, deadline: deadline ? new Date(deadline).toISOString() : undefined });
      }}
      className="grid grid-cols-1 md:grid-cols-2 gap-4"
    >
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
        <input value={title} onChange={(e)=>setTitle(e.target.value)} required placeholder="e.g. Mobile App UI/UX Design" className="w-full px-3 py-2 border rounded-md bg-white text-gray-900" />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
        <input value={category} onChange={(e)=>setCategory(e.target.value)} placeholder="e.g. Design, Technology" className="w-full px-3 py-2 border rounded-md bg-white text-gray-900" />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Budget (ETB)</label>
        <input type="number" min={0} value={budget ?? ''} onChange={(e)=>setBudget(e.target.value? Number(e.target.value): undefined)} placeholder="e.g. 2500" className="w-full px-3 py-2 border rounded-md bg-white text-gray-900" />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
        <select value={status} onChange={(e)=>setStatus(e.target.value as AdminJob['status'])} className="w-full px-3 py-2 border rounded-md bg-white text-gray-900">
          <option value="draft">Draft</option>
          <option value="posted">Posted</option>
          <option value="in_progress">In progress</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Deadline</label>
        <input type="date" value={deadline} onChange={(e)=>setDeadline(e.target.value)} className="w-full px-3 py-2 border rounded-md bg-white text-gray-900" />
      </div>
      <div className="md:col-span-2 flex gap-2 justify-end pt-2">
        <Button variant="outline" type="button" onClick={onCancel}>Cancel</Button>
        <Button type="submit">Save</Button>
      </div>
    </form>
  );
};

export default ManageJobsPage;


