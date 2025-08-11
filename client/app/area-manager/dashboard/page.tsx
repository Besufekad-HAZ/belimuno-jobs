'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Users, Briefcase, MapPin, TrendingUp, CheckCircle, AlertTriangle, UserCheck, Settings, MessageSquare, Download, BarChart3, Shield } from 'lucide-react';
import { getStoredUser, hasRole } from '@/lib/auth';
import { areaManagerAPI } from '@/lib/api';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';

interface AreaManagerStats {
  totalWorkers: number;
  verifiedWorkers: number;
  pendingVerifications: number;
  regionalJobs: number;
  completedJobs: number;
  regionalRevenue: number;
  monthlyGrowth: number;
  activeDisputes: number;
}

interface WorkerListItem { _id: string; name: string; email?: string; isVerified?: boolean; workerProfile?: { rating?: number } }
interface JobItem { _id: string; title: string; status: string; budget?: number; createdAt: string }
interface ApplicationItem { _id: string; status: string; appliedAt: string; proposedBudget?: number; worker?: { name?: string; email?: string }; job?: { title?: string } }

const AreaManagerDashboard: React.FC = () => {
  const [stats, setStats] = useState<AreaManagerStats | null>(null);
  const [workers, setWorkers] = useState<WorkerListItem[]>([]);
  const [jobs, setJobs] = useState<JobItem[]>([]);
  const [applications, setApplications] = useState<ApplicationItem[]>([]);
  const [chatJobId, setChatJobId] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<{ content: string; sender?: { name?: string; role?: string }; sentAt: string }[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showEscalationModal, setShowEscalationModal] = useState(false);
  const [selectedJob, setSelectedJob] = useState<JobItem | null>(null);
  const [escalationReason, setEscalationReason] = useState('');
  const [regionalSettings, setRegionalSettings] = useState({
    workingHours: { start: '09:00', end: '17:00' },
    language: 'amharic',
    payRates: { minimum: 100, bonus: 50 },
    allowances: { transport: 50, meal: 30 },
    holidays: ['Ethiopian New Year', 'Timkat', 'Meskel'],
  });
  const [escalations, setEscalations] = useState<{ id: number; jobId: string; type: string; description: string; status: string; createdAt: string }[]>([]);
  const router = useRouter();

  useEffect(() => {
    const user = getStoredUser();
    if (!user || !hasRole(user, ['area_manager'])) {
      router.push('/login');
      return;
    }

    fetchDashboardData();
  }, [router]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [dashboardResponse, workersResponse, jobsResponse, applicationsResponse] = await Promise.all([
        areaManagerAPI.getDashboard(),
        areaManagerAPI.getWorkers(),
        areaManagerAPI.getJobs(),
        areaManagerAPI.getApplications()
      ]);

      const d = dashboardResponse.data.data || dashboardResponse.data;
      const s = d?.stats;
      setStats(s ? {
        totalWorkers: s.totalWorkers,
        verifiedWorkers: s.verifiedWorkers,
        pendingVerifications: s.unverifiedWorkers,
        regionalJobs: s.totalJobs,
        completedJobs: s.completedJobs,
        regionalRevenue: s.regionalRevenue,
        monthlyGrowth: 0,
        activeDisputes: 0,
      } : null);
      setWorkers((workersResponse.data.data || []) as WorkerListItem[]);
      setJobs((jobsResponse.data.data || []) as JobItem[]);
      setApplications((applicationsResponse.data.data || []) as ApplicationItem[]);

      // Mock escalations data
      setEscalations([
        { id: 1, jobId: 'job_001', type: 'dispute', description: 'Client-worker payment dispute', status: 'pending', createdAt: new Date().toISOString() },
        { id: 2, jobId: 'job_002', type: 'delay', description: 'Project deadline extension request', status: 'resolved', createdAt: new Date().toISOString() },
        { id: 3, jobId: 'job_003', type: 'quality', description: 'Work quality concerns raised', status: 'investigating', createdAt: new Date().toISOString() },
      ]);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyWorker = async (workerId: string) => {
    try {
      await areaManagerAPI.verifyWorker(workerId);
      fetchDashboardData(); // Refresh data
    } catch (error) {
      console.error('Failed to verify worker:', error);
    }
  };

  const handleEscalation = (job: JobItem) => {
    setSelectedJob(job);
    setShowEscalationModal(true);
  };

  const submitEscalation = async () => {
    try {
      if (!selectedJob) return;
      await areaManagerAPI.escalateJob(String(selectedJob._id), escalationReason);
      setShowEscalationModal(false);
      setEscalationReason('');
      setSelectedJob(null);
      fetchDashboardData();
    } catch (error) {
      console.error('Failed to submit escalation:', error);
    }
  };

  const updateRegionalSettings = async () => {
    try {
      // Map UI settings to backend schema
      const payload = {
        workHourRules: {
          startTime: regionalSettings.workingHours.start,
          endTime: regionalSettings.workingHours.end,
        },
        language: regionalSettings.language,
        payRates: {
          minimum: regionalSettings.payRates.minimum,
          standard: regionalSettings.payRates.minimum, // placeholder mapping
        },
        settings: {
          notifications: { email: true, sms: true, defaultLanguage: regionalSettings.language },
        }
      };
      await areaManagerAPI.updateRegionSettings(payload);
      setShowSettingsModal(false);
      fetchDashboardData();
    } catch (error) {
      console.error('Failed to update regional settings:', error);
    }
  };

  const generateRegionalReport = async () => {
    try {
      const reportData = {
        type: 'regional_performance',
        region: 'Addis Ababa', // This would come from user context
        generatedAt: new Date().toISOString(),
        stats: stats,
        workers: workers,
        jobs: jobs,
        escalations: escalations,
        settings: regionalSettings,
      };

      const dataStr = JSON.stringify(reportData, null, 2);
      const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);

      const exportFileDefaultName = `regional-report-${new Date().toISOString().split('T')[0]}.json`;

      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileDefaultName);
      linkElement.click();

      setShowReportModal(false);
    } catch (error) {
      console.error('Failed to generate report:', error);
    }
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
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Area Manager Dashboard</h1>
            <p className="text-gray-600 mt-2">Manage your regional workers and jobs</p>
          </div>
          <div className="flex space-x-3">
            <Button variant="outline" onClick={() => setShowReportModal(true)}>
              <BarChart3 className="h-4 w-4 mr-2" />
              Generate Report
            </Button>
            {escalations.filter(e => e.status === 'pending').length > 0 && (
              <Button variant="outline" onClick={() => setShowEscalationModal(true)}>
                <AlertTriangle className="h-4 w-4 mr-2" />
                Escalations ({escalations.filter(e => e.status === 'pending').length})
              </Button>
            )}
            <Button onClick={() => setShowSettingsModal(true)}>
              <Settings className="h-4 w-4 mr-2" />
              Regional Settings
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-blue-50 border-blue-200">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="h-8 w-8 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-blue-600">Total Workers</p>
                <p className="text-2xl font-bold text-blue-900">{stats?.totalWorkers || 0}</p>
              </div>
            </div>
          </Card>

          <Card className="bg-green-50 border-green-200">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <Briefcase className="h-8 w-8 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-green-600">Regional Jobs</p>
                <p className="text-2xl font-bold text-green-900">{stats?.regionalJobs || 0}</p>
              </div>
            </div>
          </Card>

          <Card className="bg-yellow-50 border-yellow-200">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <MapPin className="h-8 w-8 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-yellow-600">Regional Revenue</p>
                <p className="text-2xl font-bold text-yellow-900">ETB {stats?.regionalRevenue?.toLocaleString() || 0}</p>
              </div>
            </div>
          </Card>

          <Card className="bg-purple-50 border-purple-200">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <TrendingUp className="h-8 w-8 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-purple-600">Monthly Growth</p>
                <p className="text-2xl font-bold text-purple-900">+{stats?.monthlyGrowth || 0}%</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Activity Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Verified Workers</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.verifiedWorkers || 0}</p>
              </div>
              <CheckCircle className="h-6 w-6 text-green-500" />
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending Verifications</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.pendingVerifications || 0}</p>
              </div>
              <AlertTriangle className="h-6 w-6 text-yellow-500" />
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Completed Jobs</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.completedJobs || 0}</p>
              </div>
              <CheckCircle className="h-6 w-6 text-blue-500" />
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Disputes</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.activeDisputes || 0}</p>
              </div>
              <AlertTriangle className="h-6 w-6 text-red-500" />
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Regional Workers */}
          <Card>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Regional Workers</h3>
              <Button variant="outline" size="sm" onClick={() => router.push('/area-manager/workers')}>
                View All
              </Button>
            </div>
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {workers.slice(0, 10).map((worker) => (
                <div key={worker._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{worker.name}</p>
                    <p className="text-sm text-gray-500">{worker.email}</p>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        worker.isVerified ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {worker.isVerified ? 'Verified' : 'Pending'}
                      </span>
                      {worker.workerProfile?.rating !== undefined && (
                        <span className="text-xs text-gray-500">
                          ⭐ {Number(worker.workerProfile.rating).toFixed(1)}
                        </span>
                      )}
                    </div>
                  </div>
                  {!worker.isVerified && (
                    <Button
                      size="sm"
                      onClick={() => handleVerifyWorker(worker._id)}
                    >
                      <UserCheck className="h-4 w-4 mr-1" />
                      Verify
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </Card>

          {/* Regional Jobs */}
          <Card>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Regional Jobs</h3>
              <Button variant="outline" size="sm" onClick={() => router.push('/area-manager/jobs')}>
                View All
              </Button>
            </div>
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {jobs.slice(0, 10).map((job) => (
                <div key={job._id} className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-medium text-gray-900 truncate">{job.title}</h4>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      job.status === 'posted' ? 'bg-green-100 text-green-800' :
                      job.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                      job.status === 'completed' ? 'bg-gray-100 text-gray-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {job.status.replace('_', ' ')}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">ETB {job.budget?.toLocaleString()}</p>
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-gray-500">
                      Posted {new Date(job.createdAt).toLocaleDateString()}
                    </p>
                    <div className="flex space-x-2">
                      {(job.status === 'disputed' || job.status === 'revision_requested' || job.status === 'in_progress') && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEscalation(job)}
                        >
                          <Shield className="h-3 w-3 mr-1" />
                          Handle
                        </Button>
                      )}
                      <Button size="sm" variant="ghost" onClick={async()=>{
                        setChatJobId(job._id);
                        const res = await areaManagerAPI.getJobMessages(job._id);
                        setChatMessages(res.data.data || []);
                      }}>
                        <MessageSquare className="h-3 w-3 mr-1" />
                        Contact
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Recent Applications */}
        <Card className="mt-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Recent Applications</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Worker
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Job
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Budget
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {applications.slice(0, 10).map((application) => (
                  <tr key={application._id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {application.worker?.name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {application.worker?.email}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 truncate max-w-xs">
                        {application.job?.title}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ETB {application.proposedBudget?.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        application.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        application.status === 'accepted' ? 'bg-green-100 text-green-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {application.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(application.appliedAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Job Chat Modal */}
        <Modal isOpen={!!chatJobId} onClose={()=>setChatJobId(null)} title="Job Messages" size="lg">
          <div className="flex flex-col h-96">
            <div className="flex-1 overflow-y-auto space-y-3 pr-2">
              {chatMessages.map((m,i)=>(
                <div key={i} className={`p-3 rounded-lg text-sm max-w-md ${m.sender?.role==='area_manager'?'bg-blue-50 ml-auto border border-blue-200':'bg-gray-100 border border-gray-200'}`}>
                  <p className="font-medium mb-1">{m.sender?.name||'You'}</p>
                  <p className="whitespace-pre-wrap text-gray-800">{m.content}</p>
                  <p className="mt-1 text-[10px] text-gray-400">{new Date(m.sentAt).toLocaleTimeString()}</p>
                </div>
              ))}
              {chatMessages.length===0 && <div className="text-xs text-gray-400">No messages yet.</div>}
            </div>
            <div className="mt-3 flex gap-2">
              <input value={newMessage} onChange={e=>setNewMessage(e.target.value)} placeholder="Type a message" className="flex-1 border rounded px-3 py-2 text-sm text-gray-900 placeholder-gray-500 focus:ring-blue-500 focus:border-blue-500"/>
              <Button disabled={sending} onClick={async()=>{
                if(!chatJobId || !newMessage.trim()) return;
                setSending(true);
                try {
                  const res = await areaManagerAPI.sendJobMessage(chatJobId, newMessage.trim());
                  setChatMessages(prev => [...prev, res.data.data]);
                  setNewMessage('');
                } finally { setSending(false); }
              }}>Send</Button>
            </div>
          </div>
        </Modal>

        {/* Regional Settings Modal */}
        <Modal
          isOpen={showSettingsModal}
          onClose={() => setShowSettingsModal(false)}
          title="Regional Settings"
          size="lg"
        >
          <div className="space-y-6">
            {/* Working Hours */}
            <Card className="bg-gray-50">
              <div className="space-y-4">
                <h4 className="font-medium text-gray-900">Working Hours</h4>
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Start Time"
                    type="time"
                    value={regionalSettings.workingHours.start}
                    onChange={(e) => setRegionalSettings({
                      ...regionalSettings,
                      workingHours: { ...regionalSettings.workingHours, start: e.target.value }
                    })}
                  />
                  <Input
                    label="End Time"
                    type="time"
                    value={regionalSettings.workingHours.end}
                    onChange={(e) => setRegionalSettings({
                      ...regionalSettings,
                      workingHours: { ...regionalSettings.workingHours, end: e.target.value }
                    })}
                  />
                </div>
              </div>
            </Card>

            {/* Language Settings */}
            <Card className="bg-gray-50">
              <div className="space-y-4">
                <h4 className="font-medium text-gray-900">Language & Localization</h4>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Primary Language
                  </label>
                  <select
                    value={regionalSettings.language}
                    onChange={(e) => setRegionalSettings({ ...regionalSettings, language: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="amharic">Amharic</option>
                    <option value="oromo">Oromo</option>
                    <option value="english">English</option>
                    <option value="tigrinya">Tigrinya</option>
                  </select>
                </div>
              </div>
            </Card>

            {/* Pay Rates */}
            <Card className="bg-gray-50">
              <div className="space-y-4">
                <h4 className="font-medium text-gray-900">Pay Rates & Allowances</h4>
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Minimum Hourly Rate (ETB)"
                    type="number"
                    value={regionalSettings.payRates.minimum}
                    onChange={(e) => setRegionalSettings({
                      ...regionalSettings,
                      payRates: { ...regionalSettings.payRates, minimum: parseInt(e.target.value) }
                    })}
                  />
                  <Input
                    label="Performance Bonus (ETB)"
                    type="number"
                    value={regionalSettings.payRates.bonus}
                    onChange={(e) => setRegionalSettings({
                      ...regionalSettings,
                      payRates: { ...regionalSettings.payRates, bonus: parseInt(e.target.value) }
                    })}
                  />
                  <Input
                    label="Transport Allowance (ETB)"
                    type="number"
                    value={regionalSettings.allowances.transport}
                    onChange={(e) => setRegionalSettings({
                      ...regionalSettings,
                      allowances: { ...regionalSettings.allowances, transport: parseInt(e.target.value) }
                    })}
                  />
                  <Input
                    label="Meal Allowance (ETB)"
                    type="number"
                    value={regionalSettings.allowances.meal}
                    onChange={(e) => setRegionalSettings({
                      ...regionalSettings,
                      allowances: { ...regionalSettings.allowances, meal: parseInt(e.target.value) }
                    })}
                  />
                </div>
              </div>
            </Card>

            {/* Regional Holidays */}
            <Card className="bg-gray-50">
              <div className="space-y-4">
                <h4 className="font-medium text-gray-900">Regional Holidays</h4>
                <div className="space-y-2">
                  {regionalSettings.holidays.map((holiday, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-white rounded border">
                      <span className="text-sm">{holiday}</span>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          const newHolidays = regionalSettings.holidays.filter((_, i) => i !== index);
                          setRegionalSettings({ ...regionalSettings, holidays: newHolidays });
                        }}
                      >
                        Remove
                      </Button>
                    </div>
                  ))}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      const newHoliday = prompt('Enter holiday name:');
                      if (newHoliday) {
                        setRegionalSettings({
                          ...regionalSettings,
                          holidays: [...regionalSettings.holidays, newHoliday]
                        });
                      }
                    }}
                  >
                    Add Holiday
                  </Button>
                </div>
              </div>
            </Card>

            {/* Save Settings */}
            <div className="flex space-x-3">
              <Button variant="outline" onClick={() => setShowSettingsModal(false)}>
                Cancel
              </Button>
              <Button onClick={updateRegionalSettings} className="flex-1">
                <Settings className="h-4 w-4 mr-2" />
                Save Settings
              </Button>
            </div>
          </div>
        </Modal>

        {/* Escalation Modal */}
        <Modal
          isOpen={showEscalationModal}
          onClose={() => setShowEscalationModal(false)}
          title="Handle Escalation"
          size="md"
        >
          <div className="space-y-6">
            {selectedJob ? (
              <>
                {/* Job Info */}
                <Card className="bg-gray-50">
                  <div className="space-y-2">
                    <h4 className="font-medium text-gray-900">Job Details</h4>
                    <p className="text-sm text-gray-600">Title: {selectedJob.title}</p>
                    <p className="text-sm text-gray-600">Status: {selectedJob.status}</p>
                    <p className="text-sm text-gray-600">Budget: ETB {selectedJob.budget?.toLocaleString()}</p>
                  </div>
                </Card>

                {/* Escalation Reason */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Escalation Details
                  </label>
                  <textarea
                    rows={4}
                    value={escalationReason}
                    onChange={(e) => setEscalationReason(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Describe the issue and proposed resolution..."
                  />
                </div>

                {/* Quick Actions */}
                <div className="grid grid-cols-3 gap-3">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setEscalationReason('Payment dispute - requesting mediation')}
                  >
                    Payment Issue
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setEscalationReason('Quality concerns - work does not meet requirements')}
                  >
                    Quality Issue
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setEscalationReason('Timeline delay - requesting deadline extension')}
                  >
                    Timeline Issue
                  </Button>
                </div>

                {/* Submit Actions */}
                <div className="flex space-x-3">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowEscalationModal(false);
                      setEscalationReason('');
                      setSelectedJob(null);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={submitEscalation}
                    disabled={!escalationReason.trim()}
                    className="flex-1"
                  >
                    <Shield className="h-4 w-4 mr-2" />
                    Submit Escalation
                  </Button>
                </div>
              </>
            ) : (
              /* Escalations List */
              <div className="space-y-4">
                <h4 className="font-medium text-gray-900">Active Escalations</h4>
                {escalations.length > 0 ? (
                  escalations.map((escalation) => (
                    <Card key={escalation.id} className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h5 className="font-medium text-gray-900">Job #{escalation.jobId}</h5>
                          <p className="text-sm text-gray-600">{escalation.description}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            {new Date(escalation.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <Badge
                          variant={
                            escalation.status === 'pending' ? 'warning' :
                            escalation.status === 'resolved' ? 'success' :
                            'info'
                          }
                        >
                          {escalation.status}
                        </Badge>
                      </div>

                      {escalation.status === 'pending' && (
                        <div className="flex space-x-2">
                          <Button size="sm" variant="outline">
                            Investigate
                          </Button>
                          <Button size="sm">
                            Resolve
                          </Button>
                        </div>
                      )}
                    </Card>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Active Escalations</h3>
                    <p className="text-gray-600">All issues in your region are resolved!</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </Modal>

        {/* Regional Report Modal */}
        <Modal
          isOpen={showReportModal}
          onClose={() => setShowReportModal(false)}
          title="Generate Regional Report"
          size="md"
        >
          <div className="space-y-6">
            {/* Report Preview */}
            <Card className="bg-gray-50">
              <div className="space-y-3">
                <h4 className="font-medium text-gray-900">Regional Performance Summary</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500">Total Workers</p>
                    <p className="font-semibold">{stats?.totalWorkers || 0}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Verified Workers</p>
                    <p className="font-semibold">{stats?.verifiedWorkers || 0}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Regional Jobs</p>
                    <p className="font-semibold">{stats?.regionalJobs || 0}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Completed Jobs</p>
                    <p className="font-semibold">{stats?.completedJobs || 0}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Regional Revenue</p>
                    <p className="font-semibold">ETB {stats?.regionalRevenue?.toLocaleString() || 0}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Active Escalations</p>
                    <p className="font-semibold">{escalations.filter(e => e.status === 'pending').length}</p>
                  </div>
                </div>
              </div>
            </Card>

            {/* Report Features */}
            <div className="space-y-3">
              <h4 className="font-medium text-gray-900">Report Includes:</h4>
              <div className="grid grid-cols-1 gap-2">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm text-gray-600">Worker performance metrics</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm text-gray-600">Job completion rates</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm text-gray-600">Regional revenue analysis</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm text-gray-600">Escalation tracking</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm text-gray-600">Regional settings overview</span>
                </div>
              </div>
            </div>

            {/* Generate Report */}
            <div className="flex space-x-3">
              <Button variant="outline" onClick={() => setShowReportModal(false)}>
                Cancel
              </Button>
              <Button onClick={generateRegionalReport} className="flex-1">
                <Download className="h-4 w-4 mr-2" />
                Download Regional Report
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </div>
  );
};

export default AreaManagerDashboard;
