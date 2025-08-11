"use client";
import React, { useEffect, useState, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { clientAPI } from '@/lib/api';
import { getStoredUser, hasRole } from '@/lib/auth';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import { Search, Filter, User, Check, X, MessageCircle } from 'lucide-react';

interface WorkerInfo { _id: string; name: string; profile?: { avatar?: string }; workerProfile?: { rating?: number; skills?: string[] } }
interface Application { _id: string; proposal: string; proposedBudget: number; status: string; appliedAt: string; worker: WorkerInfo }
interface JobDetail { _id: string; title: string; status: string; budget: number; deadline: string; description: string; }

const ApplicationsPage: React.FC = () => {
  const router = useRouter();
  const params = useParams();
  const jobId = params?.id as string;
  const [job, setJob] = useState<JobDetail | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [loading, setLoading] = useState(true);
  const [messageModal, setMessageModal] = useState(false);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const user = getStoredUser();
      if (!user || !hasRole(user, ['client'])) { router.push('/login'); return; }
      const jobRes = await clientAPI.getJob(jobId);
      setJob(jobRes.data.job || jobRes.data.data?.job || jobRes.data.data?.job || jobRes.data.data?.job); // fallback chain
      const apps = jobRes.data.applications || jobRes.data.data?.applications || [];
      setApplications(apps);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  }, [jobId, router]);

  useEffect(() => { if (jobId) load(); }, [jobId, load]);

  const filtered = applications.filter(a => (filterStatus==='all'||a.status===filterStatus) && (a.worker.name.toLowerCase().includes(search.toLowerCase()) || a.proposal.toLowerCase().includes(search.toLowerCase())));

  const accept = async (applicationId: string) => { await clientAPI.acceptApplication(jobId, applicationId); await load(); };
  const reject = async (applicationId: string) => { await clientAPI.rejectApplication(jobId, applicationId); await load(); };

  const openMessages = async () => {
    try {
      setMessageModal(true);
      const res = await clientAPI.getJobMessages(jobId);
      setChatMessages(res.data.data || []);
    } catch (e) { console.error(e); }
  };

  const sendMessage = async () => {
    if (!newMessage.trim()) return; setSending(true);
    try {
      const res = await clientAPI.sendJobMessage(jobId, newMessage.trim());
      setChatMessages(prev => [...prev, res.data.data]);
      setNewMessage('');
    } catch (e) { console.error(e); } finally { setSending(false); }
  };

  if (loading) return <div className="p-8">Loading...</div>;
  if (!job) return <div className="p-8">Job not found</div>;

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Applications for: {job.title}</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => router.push('/client/dashboard')}>Back</Button>
          <Button onClick={openMessages}><MessageCircle className="h-4 w-4 mr-1"/>Messages</Button>
        </div>
      </div>

      <Card className="p-4 flex flex-wrap gap-4 items-center">
        <div className="flex items-center gap-2">
          <Search className="h-4 w-4 text-gray-500"/>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search proposals or workers" className="border rounded px-2 py-1 text-sm"/>
        </div>
        <div className="flex gap-2 items-center">
          <Filter className="h-4 w-4 text-gray-500"/>
          {['all','pending','accepted','rejected','withdrawn'].map(s => (
            <button key={s} onClick={()=>setFilterStatus(s)} className={`text-xs px-2 py-1 rounded border ${filterStatus===s?'bg-blue-600 text-white border-blue-600':'bg-white text-gray-700'}`}>{s}</button>
          ))}
        </div>
        <div className="ml-auto text-sm text-gray-500">{filtered.length} / {applications.length} shown</div>
      </Card>

      <div className="grid grid-cols-1 gap-4">
        {filtered.map(app => (
          <Card key={app._id} className="p-4">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-gray-500"/>
                  <span className="font-medium">{app.worker.name}</span>
                  <Badge variant={app.status==='accepted'?'success':app.status==='rejected'?'danger':'secondary'}>{app.status}</Badge>
                </div>
                <p className="text-sm text-gray-600 line-clamp-2">{app.proposal}</p>
                <p className="text-sm font-semibold text-green-600">ETB {app.proposedBudget.toLocaleString()}</p>
                <p className="text-xs text-gray-400">Applied {new Date(app.appliedAt).toLocaleString()}</p>
              </div>
              <div className="flex gap-2">
                {app.status==='pending' && (
                  <>
                    <Button size="sm" variant="outline" onClick={()=>reject(app._id)}><X className="h-4 w-4"/></Button>
                    <Button size="sm" onClick={()=>accept(app._id)}><Check className="h-4 w-4"/></Button>
                  </>
                )}
                <Button size="sm" variant="outline" onClick={()=>setSelectedApp(app)}>View</Button>
              </div>
            </div>
          </Card>
        ))}
        {filtered.length===0 && <Card className="p-8 text-center text-gray-500">No applications match your filters.</Card>}
      </div>

      {/* Application detail modal */}
      <Modal isOpen={!!selectedApp} onClose={()=>setSelectedApp(null)} title="Application Details" size="md">
        {selectedApp && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold">{selectedApp.worker.name}</h3>
              <Badge variant={selectedApp.status==='accepted'?'success':selectedApp.status==='rejected'?'danger':'secondary'}>{selectedApp.status}</Badge>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-1">Proposal</h4>
              <p className="text-sm text-gray-600 whitespace-pre-wrap">{selectedApp.proposal}</p>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-500">Budget</p>
                <p className="font-semibold text-green-600">ETB {selectedApp.proposedBudget.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-gray-500">Applied</p>
                <p>{new Date(selectedApp.appliedAt).toLocaleString()}</p>
              </div>
            </div>
            {selectedApp.status==='pending' && (
              <div className="flex gap-2">
                <Button variant="outline" onClick={()=>reject(selectedApp._id)} className="flex-1">Reject</Button>
                <Button onClick={()=>accept(selectedApp._id)} className="flex-1">Accept</Button>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Messaging modal */}
      <Modal isOpen={messageModal} onClose={()=>setMessageModal(false)} title="Job Messages" size="lg">
        <div className="flex flex-col h-96">
          <div className="flex-1 overflow-y-auto space-y-3 pr-2">
            {chatMessages.map((m:any,i:number)=>(
              <div key={i} className={`p-3 rounded-lg text-sm max-w-md ${m.sender?.role==='client'?'bg-blue-50 ml-auto':'bg-gray-100'}`}>
                <p className="font-medium mb-1">{m.sender?.name||'You'}</p>
                <p className="whitespace-pre-wrap text-gray-700">{m.content}</p>
                <p className="mt-1 text-[10px] text-gray-400">{new Date(m.sentAt).toLocaleTimeString()}</p>
              </div>
            ))}
            {chatMessages.length===0 && <div className="text-xs text-gray-400">No messages yet. Start the conversation.</div>}
          </div>
          <div className="mt-3 flex gap-2">
            <input value={newMessage} onChange={e=>setNewMessage(e.target.value)} placeholder="Type a message" className="flex-1 border rounded px-3 py-2 text-sm"/>
            <Button disabled={sending} onClick={sendMessage}>Send</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
export default ApplicationsPage;
