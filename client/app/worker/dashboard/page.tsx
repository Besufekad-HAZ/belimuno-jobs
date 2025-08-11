'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Briefcase, DollarSign, Clock, Star, CheckCircle, Eye, Send, Bell, Wallet, TrendingUp, MessageCircle, ThumbsUp, ThumbsDown } from 'lucide-react';
import { getStoredUser, hasRole } from '@/lib/auth';
import { workerAPI, jobsAPI } from '@/lib/api';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import ProgressBar from '@/components/ui/ProgressBar';

interface WorkerStats {
  totalApplications: number;
  activeJobs: number;
  completedJobs: number;
  totalEarnings: number;
  averageRating: number;
  pendingApplications: number;
  name?: string;
  pendingApplicationsList?: { _id: string; job?: { title?: string }; appliedAt: string }[];
}

const WorkerDashboard: React.FC = () => {
  const [stats, setStats] = useState<WorkerStats | null>(null);
  interface SimpleJob { _id: string; title: string; description: string; budget: number; deadline: string; category?: string; region?: { name?: string }; status?: string; progress?: number; acceptedApplication?: { proposedBudget?: number }; applicationCount?: number; }
  interface NotificationItem { id: number|string; type: string; message: string; time: string; read: boolean; }
  interface EarningsData { recentPayments?: { jobTitle?: string; amount?: number; date?: string }[] }
  const [availableJobs, setAvailableJobs] = useState<SimpleJob[]>([]);
  const [myJobs, setMyJobs] = useState<SimpleJob[]>([]);
  const [appliedJobIds, setAppliedJobIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [selectedJob, setSelectedJob] = useState<SimpleJob | null>(null);
  const [applicationData, setApplicationData] = useState<{ proposal: string; proposedBudget: string; estimatedDuration?: string }>({ proposal: '', proposedBudget: '' });
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [showNotificationsModal, setShowNotificationsModal] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [earnings, setEarnings] = useState<EarningsData | null>(null);
  const [chatJobId, setChatJobId] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<{ _id?: string; content: string; sender?: { name?: string; role?: string }; sentAt: string }[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const user = getStoredUser();
    if (!user || !hasRole(user, ['worker'])) {
      router.push('/login');
      return;
    }

    fetchDashboardData();
  }, [router]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [dashboardResponse, jobsResponse, myJobsResponse, applicationsResponse, earningsResponse] = await Promise.all([
        workerAPI.getDashboard(),
        jobsAPI.getAll({ status: 'open', limit: 10 }),
        workerAPI.getJobs(),
        workerAPI.getApplications(),
        workerAPI.getEarnings(),
      ]);

  setStats(dashboardResponse.data.data || dashboardResponse.data); // support either wrapped or direct
  setAvailableJobs(jobsResponse.data.data || []);
  setMyJobs(myJobsResponse.data.data || []);
  const apps: { job?: { _id: string } }[] = applicationsResponse.data.data || [];
  setAppliedJobIds(new Set(apps.map((a) => a.job?._id).filter(Boolean) as string[]));
      setEarnings(earningsResponse.data);

      // Mock notifications for demo
      setNotifications([
        { id: 1, type: 'job_accepted', message: 'Your application for "Website Development" has been accepted!', time: '2 hours ago', read: false },
        { id: 2, type: 'payment', message: 'Payment of ETB 5,000 has been processed', time: '1 day ago', read: false },
        { id: 3, type: 'job_completed', message: 'Job "Mobile App Design" marked as completed', time: '3 days ago', read: true },
      ]);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApplyToJob = async (jobId: string) => {
    try {
      await jobsAPI.apply(jobId, applicationData.proposal, parseFloat(applicationData.proposedBudget));
      setSelectedJob(null);
      setApplicationData({ proposal: '', proposedBudget: '' });
      fetchDashboardData(); // Refresh data
    } catch (error) {
      console.error('Failed to apply to job:', error);
    }
  };

  const handleUpdateJobStatus = async (jobId: string, status: string, progress?: number) => {
    try {
      await workerAPI.updateJobStatus(jobId, status, progress);
      fetchDashboardData(); // Refresh data
    } catch (error) {
      console.error('Failed to update job status:', error);
    }
  };

  const openChat = async (jobId: string) => {
    try {
      setChatJobId(jobId);
      const res = await workerAPI.getJobMessages(jobId);
      setChatMessages(res.data.data || []);
    } catch (e) { console.error(e); }
  };

  const sendChat = async () => {
    if (!chatJobId || !newMessage.trim()) return;
    setSending(true);
    try {
      const res = await workerAPI.sendJobMessage(chatJobId, newMessage.trim());
      setChatMessages(prev => [...prev, res.data.data]);
      setNewMessage('');
    } catch (e) { console.error(e); } finally { setSending(false); }
  };

  const acceptAssignment = async (jobId: string) => {
    await workerAPI.acceptAssignedJob(jobId);
    fetchDashboardData();
  };
  const declineAssignment = async (jobId: string) => {
    await workerAPI.declineAssignedJob(jobId);
    fetchDashboardData();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Worker Dashboard</h1>
              <p className="text-gray-600 mt-2">Manage your jobs and track your earnings</p>
            </div>
            <div className="flex space-x-3">
              <Button
                variant="outline"
                onClick={() => setShowNotificationsModal(true)}
                className="relative"
              >
                <Bell className="h-4 w-4 mr-2" />
                Notifications
                {notifications.filter(n => !n.read).length > 0 && (
                  <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                    {notifications.filter(n => !n.read).length}
                  </span>
                )}
              </Button>
              <Button variant="outline" onClick={() => setShowWalletModal(true)}>
                <Wallet className="h-4 w-4 mr-2" />
                Wallet
              </Button>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          <Card className="bg-blue-50 border-blue-200">
            <div className="text-center">
              <Briefcase className="h-8 w-8 text-blue-600 mx-auto mb-2" />
              <p className="text-sm font-medium text-blue-600">Active Jobs</p>
              <p className="text-2xl font-bold text-blue-900">{stats?.activeJobs ?? 0}</p>
            </div>
          </Card>

          <Card className="bg-green-50 border-green-200">
            <div className="text-center">
              <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <p className="text-sm font-medium text-green-600">Completed</p>
              <p className="text-2xl font-bold text-green-900">{stats?.completedJobs ?? 0}</p>
            </div>
          </Card>

          <Card className="bg-yellow-50 border-yellow-200">
            <div className="text-center">
              <DollarSign className="h-8 w-8 text-yellow-600 mx-auto mb-2" />
              <p className="text-sm font-medium text-yellow-600">Total Earnings</p>
              <p className="text-xl font-bold text-yellow-900">ETB {(stats?.totalEarnings || 0).toLocaleString()}</p>
            </div>
          </Card>

          <Card className="bg-purple-50 border-purple-200">
            <div className="text-center">
              <Star className="h-8 w-8 text-purple-600 mx-auto mb-2" />
              <p className="text-sm font-medium text-purple-600">Rating</p>
              <p className="text-2xl font-bold text-purple-900">{stats?.averageRating !== undefined ? stats.averageRating.toFixed(1) : 'N/A'}</p>
            </div>
          </Card>

          <Card className="bg-indigo-50 border-indigo-200">
            <div className="text-center">
              <Send className="h-8 w-8 text-indigo-600 mx-auto mb-2" />
              <p className="text-sm font-medium text-indigo-600">Applications</p>
              <p className="text-2xl font-bold text-indigo-900">{stats?.totalApplications ?? 0}</p>
            </div>
          </Card>

          <Card className="bg-orange-50 border-orange-200">
            <div className="text-center">
              <Clock className="h-8 w-8 text-orange-600 mx-auto mb-2" />
              <p className="text-sm font-medium text-orange-600">Pending</p>
              <p className="text-2xl font-bold text-orange-900">{stats?.pendingApplications ?? 0}</p>
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Available Jobs */}
          <Card>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Available Jobs</h3>
              <Button variant="outline" size="sm" onClick={() => router.push('/jobs')}>
                View All
              </Button>
            </div>
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {availableJobs.map((job) => (
                <div key={job._id} className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-medium text-gray-900">{job.title}</h4>
                      <div className="text-right">
                        <span className="text-sm font-semibold text-green-600 block">
                          ETB {job.budget?.toLocaleString()}
                        </span>
                        { job.applicationCount !== undefined && (
                          <span className="text-[11px] text-gray-500">{job.applicationCount} apps</span>
                        )}
                      </div>
                  </div>
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">{job.description}</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 text-xs text-gray-500">
                      <span>Due: {new Date(job.deadline).toLocaleDateString()}</span>
                      <span>•</span>
                      <span>{job.category}</span>
                    </div>
                    <div className="flex space-x-2">
                      <Button size="sm" variant="outline" onClick={() => setSelectedJob(job)}>
                        <Eye className="h-4 w-4 mr-1" />
                        {appliedJobIds.has(job._id) ? 'Details' : 'View'}
                      </Button>
                      <Button size="sm" onClick={() => setSelectedJob(job)} disabled={appliedJobIds.has(job._id)}>
                        {appliedJobIds.has(job._id) ? 'Applied' : 'Apply'}
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* My Active Jobs */}
          <Card>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">My Active Jobs</h3>
            </div>
            <div className="space-y-4 max-h-96 overflow-y-auto">
          {/* Pending Applications Snapshot */}
          <Card className="mt-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Pending Applications</h3>
            {stats?.pendingApplicationsList?.length ? (
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {stats.pendingApplicationsList.map((app) => (
                  <div key={app._id} className="p-3 bg-gray-50 rounded border flex items-center justify-between">
                    <div className="mr-4">
                      <p className="text-sm font-medium text-gray-900 line-clamp-1">{app.job?.title || 'Job'}</p>
                      <p className="text-xs text-gray-500">Applied {new Date(app.appliedAt).toLocaleDateString()}</p>
                    </div>
                    <span className="text-xs px-2 py-1 rounded-full bg-yellow-100 text-yellow-700">Pending</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">No pending applications.</p>
            )}
          </Card>
        {myJobs.filter(job => job.status && ['assigned','in_progress', 'revision_requested'].includes(job.status)).map((job) => (
                <div key={job._id} className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-medium text-gray-900">{job.title}</h4>
                    <span className={`px-2 py-1 text-xs rounded-full ${
          job.status === 'in_progress' ? 'bg-blue-100 text-blue-800' : job.status === 'assigned' ? 'bg-purple-100 text-purple-800' :
          'bg-yellow-100 text-yellow-800'
                    }`}>
                      {job.status ? job.status.replace('_', ' ') : ''}
                    </span>
                  </div>
                                      <div className="mb-3">
                      <ProgressBar
                        progress={job.progress || 0}
                        size="md"
                        color={(job.progress || 0) >= 100 ? 'green' : (job.progress || 0) >= 50 ? 'blue' : 'yellow'}
                      />
                    </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">
                      ETB {job.acceptedApplication?.proposedBudget?.toLocaleString()}
                    </span>
                    <div className="flex space-x-2">
                      {job.status === 'assigned' && (
                        <>
                          <Button size="sm" variant="outline" onClick={() => declineAssignment(job._id)}>
                            <ThumbsDown className="h-4 w-4 mr-1"/>Decline
                          </Button>
                          <Button size="sm" onClick={() => acceptAssignment(job._id)}>
                            <ThumbsUp className="h-4 w-4 mr-1"/>Accept
                          </Button>
                        </>
                      )}
                      {job.status === 'in_progress' && (
                        <Button
                          size="sm"
                          onClick={() => handleUpdateJobStatus(job._id, 'completed')}
                        >
                          Mark Complete
                        </Button>
                      )}
                      {job.status === 'revision_requested' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleUpdateJobStatus(job._id, 'in_progress')}
                        >
                          Resubmit
                        </Button>
                      )}
                      <Button size="sm" variant="outline" onClick={() => openChat(job._id)}>
                        <MessageCircle className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Enhanced Application Modal */}
        {selectedJob && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedJob(null)} />
            <div className="relative w-full max-w-lg animate-[fadeIn_0.25s_ease]">
              <Card className="p-0 overflow-hidden shadow-2xl border border-gray-200">
                {/* Header */}
                <div className="px-6 py-4 bg-gradient-to-r from-indigo-600 to-blue-600 text-white flex items-start justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-wide opacity-80 mb-1">Apply to Job</p>
                    <h3 className="text-lg font-semibold leading-snug line-clamp-2 pr-4">{selectedJob.title}</h3>
                  </div>
                  <button
                    onClick={() => setSelectedJob(null)}
                    className="text-white/70 hover:text-white transition-colors"
                    aria-label="Close application form"
                  >
                    ×
                  </button>
                </div>

                {/* Job Quick Summary */}
                <div className="px-6 pt-5 pb-4 bg-gray-50 grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500">Budget</p>
                    <p className="font-medium text-gray-900">ETB {selectedJob.budget?.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Deadline</p>
                    <p className="font-medium text-gray-900">{new Date(selectedJob.deadline).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Category</p>
                    <p className="font-medium text-gray-900">{selectedJob.category}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Region</p>
                    <p className="font-medium text-gray-900">{selectedJob.region?.name || '—'}</p>
                  </div>
                </div>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleApplyToJob(selectedJob._id);
                  }}
                  className="px-6 pb-6 pt-2 space-y-5"
                >
                  {/* Proposal */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-sm font-medium text-gray-700">Proposal</label>
                      <span className={`text-xs ${applicationData.proposal.length > 1000 ? 'text-red-500' : 'text-gray-400'}`}>{applicationData.proposal.length}/1000</span>
                    </div>
                    <textarea
                      rows={5}
                      maxLength={1200}
                      required
                      value={applicationData.proposal}
                      onChange={(e) => setApplicationData({ ...applicationData, proposal: e.target.value })}
                      className="w-full resize-none rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="Explain your approach, relevant experience, deliverables and timeline..."
                    />
                    <p className="mt-1 text-xs text-gray-500">A clear, concise proposal improves acceptance chances.</p>
                  </div>

                  {/* Budget & Duration */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Proposed Budget (ETB)</label>
                      <input
                        type="number"
                        min={1}
                        required
                        value={applicationData.proposedBudget}
                        onChange={(e) => setApplicationData({ ...applicationData, proposedBudget: e.target.value })}
                        className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="e.g. 4500"
                      />
                      <p className="mt-1 text-xs text-gray-500">Client budget: ETB {selectedJob.budget?.toLocaleString()}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Estimated Duration</label>
                      <input
                        type="text"
                        value={applicationData.estimatedDuration || ''}
                        onChange={(e) => setApplicationData({ ...applicationData, estimatedDuration: e.target.value })}
                        className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="e.g. 5 days"
                      />
                      <p className="mt-1 text-xs text-gray-500">Optional – helps the client assess timeline.</p>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center justify-between pt-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setSelectedJob(null);
                        setApplicationData({ proposal: '', proposedBudget: '' });
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={!applicationData.proposal || !applicationData.proposedBudget}
                      className="min-w-[160px]"
                    >
                      Submit Application
                    </Button>
                  </div>
                </form>
              </Card>
            </div>
          </div>
        )}

        {/* Wallet Modal */}
        <Modal
          isOpen={showWalletModal}
          onClose={() => setShowWalletModal(false)}
          title="Worker Wallet"
          size="md"
        >
          <div className="space-y-6">
            {/* Wallet Balance */}
            <Card className="bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
              <div className="text-center">
                <Wallet className="h-12 w-12 text-green-600 mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  ETB {stats?.totalEarnings?.toLocaleString() || '0'}
                </h3>
                <p className="text-green-600 font-medium">Available Balance</p>
              </div>
            </Card>

            {/* Recent Earnings */}
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Recent Earnings</h4>
              <div className="space-y-3">
                {earnings?.recentPayments?.slice(0, 5).map((payment: { jobTitle?: string; amount?: number; date?: string }, index: number) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">{payment.jobTitle || 'Job Payment'}</p>
                      <p className="text-sm text-gray-500">{payment.date || 'Recently'}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-green-600">+ETB {payment.amount?.toLocaleString() || '1,000'}</p>
                      <Badge variant="success" size="sm">Completed</Badge>
                    </div>
                  </div>
                )) || [
                  // Mock data for demo
                  { jobTitle: 'Website Development', amount: 5000, date: '2 days ago' },
                  { jobTitle: 'Logo Design', amount: 1500, date: '1 week ago' },
                  { jobTitle: 'Data Entry', amount: 800, date: '2 weeks ago' },
                ].map((payment, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">{payment.jobTitle}</p>
                      <p className="text-sm text-gray-500">{payment.date}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-green-600">+ETB {payment.amount.toLocaleString()}</p>
                      <Badge variant="success" size="sm">Completed</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Withdrawal Button */}
            <div className="pt-4 border-t border-gray-200">
              <Button className="w-full" onClick={() => alert('Withdrawal feature coming soon!')}>
                <TrendingUp className="h-4 w-4 mr-2" />
                Withdraw Funds
              </Button>
            </div>
          </div>
        </Modal>

        {/* Notifications Modal */}
        <Modal
          isOpen={showNotificationsModal}
          onClose={() => setShowNotificationsModal(false)}
          title="Notifications"
          size="md"
        >
          <div className="space-y-4">
            {notifications.length > 0 ? (
              notifications.map((notification) => (
                <Card key={notification.id} className={`p-4 ${!notification.read ? 'bg-blue-50 border-blue-200' : ''}`}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <Bell className={`h-4 w-4 ${!notification.read ? 'text-blue-600' : 'text-gray-400'}`} />
                        <Badge
                          variant={
                            notification.type === 'payment' ? 'success' :
                            notification.type === 'job_accepted' ? 'primary' :
                            'secondary'
                          }
                          size="sm"
                        >
                          {notification.type.replace('_', ' ')}
                        </Badge>
                        {!notification.read && <div className="w-2 h-2 bg-blue-600 rounded-full" />}
                      </div>
                      <p className="text-gray-900 mb-1">{notification.message}</p>
                      <p className="text-sm text-gray-500">{notification.time}</p>
                    </div>
                  </div>
                </Card>
              ))
            ) : (
              <div className="text-center py-8">
                <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No notifications</h3>
                <p className="text-gray-600">You&apos;re all caught up!</p>
              </div>
            )}

            {notifications.filter(n => !n.read).length > 0 && (
              <div className="pt-4 border-t border-gray-200">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    setNotifications(notifications.map(n => ({ ...n, read: true })));
                  }}
                >
                  Mark All as Read
                </Button>
              </div>
            )}
          </div>
        </Modal>
        {/* Chat Modal */}
        <Modal isOpen={!!chatJobId} onClose={()=>setChatJobId(null)} title="Job Chat" size="lg">
          <div className="flex flex-col h-96">
            <div className="flex-1 overflow-y-auto space-y-3 pr-2">
              {chatMessages.map((m,i)=>(
                <div key={i} className={`p-3 rounded-lg text-sm max-w-md ${m.sender?.role==='worker'?'bg-blue-50 ml-auto border border-blue-200':'bg-gray-100 border border-gray-200'}`}>
                  <p className="font-medium mb-1">{m.sender?.name||'You'}</p>
                  <p className="whitespace-pre-wrap text-gray-800">{m.content}</p>
                  <p className="mt-1 text-[10px] text-gray-400">{new Date(m.sentAt).toLocaleTimeString()}</p>
                </div>
              ))}
              {chatMessages.length===0 && <div className="text-xs text-gray-400">No messages yet.</div>}
            </div>
            <div className="mt-3 flex gap-2">
              <input value={newMessage} onChange={e=>setNewMessage(e.target.value)} placeholder="Type a message" className="flex-1 border rounded px-3 py-2 text-sm text-gray-900 placeholder-gray-500 focus:ring-blue-500 focus:border-blue-500"/>
              <Button disabled={sending} onClick={sendChat}>Send</Button>
            </div>
          </div>
        </Modal>
      </div>
    </div>
  );
};

export default WorkerDashboard;
