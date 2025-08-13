"use client";

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Users, Search, Filter, UserX, Shield, Mail, CheckCircle2, AlertTriangle, ChevronLeft, ChevronRight, RefreshCcw } from 'lucide-react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
// import Input from '@/components/ui/Input';
import Badge from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import { getStoredUser, hasRole } from '@/lib/auth';
import { adminAPI } from '@/lib/api';

interface UserItem {
  _id: string;
  name: string;
  email: string;
  role: 'super_admin' | 'admin_hr' | 'admin_outsource' | 'worker' | 'client';
  isVerified?: boolean;
  isActive?: boolean;
  createdAt?: string;
  region?: { name?: string } | string;
}

const Roles = ['super_admin','admin_hr','admin_outsource','worker','client'] as const;

type Filters = {
  search: string;
  role: typeof Roles[number] | 'all';
  isVerified: 'all' | 'true' | 'false';
  isActive: 'all' | 'true' | 'false';
};

const defaultFilters: Filters = {
  search: '',
  role: 'all',
  isVerified: 'all',
  isActive: 'all',
};

const AdminUsersPage: React.FC = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<UserItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(12);
  const [filters, setFilters] = useState<Filters>(defaultFilters);
  const [verifyModal, setVerifyModal] = useState<{ open: boolean; user?: UserItem }>( { open: false } );
  const [deactivateModal, setDeactivateModal] = useState<{ open: boolean; user?: UserItem; reason?: string }>( { open: false } );
  const [reactivatingId, setReactivatingId] = useState<string | null>(null);
  const [editRole, setEditRole] = useState<{ open: boolean; user?: UserItem; newRole?: UserItem['role'] }>({ open: false });

  useEffect(() => {
    const u = getStoredUser();
    if (!u || !hasRole(u, ['super_admin'])) {
      router.push('/login');
      return;
    }
  }, [router]);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, limit, filters]);

  const load = async () => {
    try {
      setLoading(true);
      const params: Record<string, unknown> = {
        page,
        limit,
      };
      if (filters.search.trim()) params.search = filters.search.trim();
      if (filters.role !== 'all') params.role = filters.role;
      if (filters.isVerified !== 'all') params.isVerified = filters.isVerified;
      if (filters.isActive !== 'all') params.isActive = filters.isActive;

      const res = await adminAPI.getUsers(params);
      const data = res.data.data || [];
      setUsers(data);
      setTotal(res.data.total || data.length);
    } catch (e) {
      console.error('Failed to load users', e);
    } finally {
      setLoading(false);
    }
  };

  const pages = useMemo(() => Math.max(1, Math.ceil(total / limit)), [total, limit]);

  const verify = async (id: string) => {
    await adminAPI.verifyWorker(id);
    setVerifyModal({ open: false });
    await load();
  };

  const deactivate = async (id: string) => {
    await adminAPI.deactivateUser(id, deactivateModal.reason);
    setDeactivateModal({ open: false });
    await load();
  };

  const reactivate = async (id: string) => {
    try {
      setReactivatingId(id);
      await adminAPI.activateUser(id);
      await load();
    } finally {
      setReactivatingId(null);
    }
  };

  const resetFilters = () => setFilters(defaultFilters);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Manage Users</h1>
              <p className="text-gray-600">Search, filter, verify, and deactivate users</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={resetFilters}>Reset</Button>
            <Button onClick={load}>Refresh</Button>
          </div>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="md:col-span-2 flex items-center gap-2">
              <Search className="h-4 w-4 text-gray-600" />
              <input
                value={filters.search}
                onChange={(e)=>setFilters(f=>({...f, search: e.target.value}))}
                placeholder="Search by name or email"
                className="flex-1 border rounded px-3 py-2 text-sm text-gray-900 placeholder-gray-500 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <select value={filters.role} onChange={e=>setFilters(f=>({...f, role: e.target.value as Filters['role']}))} className="flex-1 border rounded px-3 py-2 text-sm bg-white">
                <option value="all">All Roles</option>
                {Roles.map(r=> <option key={r} value={r}>{r.replace('_',' ')}</option>)}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-gray-500" />
              <select value={filters.isVerified} onChange={e=>setFilters(f=>({...f, isVerified: e.target.value as Filters['isVerified']}))} className="flex-1 border rounded px-3 py-2 text-sm bg-white">
                <option value="all">Verification</option>
                <option value="true">Verified</option>
                <option value="false">Unverified</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-gray-500" />
              <select value={filters.isActive} onChange={e=>setFilters(f=>({...f, isActive: e.target.value as Filters['isActive']}))} className="flex-1 border rounded px-3 py-2 text-sm bg-white">
                <option value="all">Active Status</option>
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
            </div>
          </div>
        </Card>

        {/* Users grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            Array.from({length: 6}).map((_,i)=> (
              <Card key={i} className="p-6 animate-pulse">
                <div className="h-5 w-3/4 bg-gray-200 rounded mb-3"></div>
                <div className="h-4 w-1/2 bg-gray-200 rounded mb-4"></div>
                <div className="h-8 w-full bg-gray-200 rounded"></div>
              </Card>
            ))
          ) : users.length === 0 ? (
            <Card className="p-8 text-center text-gray-500 md:col-span-2 lg:col-span-3">No users found.</Card>
          ) : (
            users.map(user => (
              <Card key={user._id} className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{user.name}</h3>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Mail className="h-3.5 w-3.5" />
                      <span>{user.email}</span>
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                      <Badge variant="secondary" size="sm" className="capitalize">{user.role.replace('_',' ')}</Badge>
                      <Badge variant={user.isVerified ? 'success' : 'warning'} size="sm">{user.isVerified ? 'Verified' : 'Pending'}</Badge>
                      <Badge variant={user.isActive ? 'success' : 'danger'} size="sm">{user.isActive ? 'Active' : 'Inactive'}</Badge>
                    </div>
                  </div>
                </div>
                <div className="mt-4 flex gap-2">
                  {user.role === 'worker' && !user.isVerified && (
                    <Button size="sm" onClick={() => setVerifyModal({ open: true, user })}>
                      <CheckCircle2 className="h-4 w-4 mr-1" /> Verify
                    </Button>
                  )}
                  <Button size="sm" variant="outline" onClick={()=> setEditRole({ open: true, user, newRole: user.role })}>
                    <Shield className="h-4 w-4 mr-1"/> Change Role
                  </Button>
                  {user.isActive === false ? (
                    <Button size="sm" onClick={() => reactivate(user._id)} disabled={reactivatingId === user._id}>
                      {reactivatingId === user._id ? 'Reactivating…' : 'Reactivate'}
                    </Button>
                  ) : (
                    <Button size="sm" variant="outline" onClick={() => setDeactivateModal({ open: true, user })}>
                      <UserX className="h-4 w-4 mr-1" /> Deactivate
                    </Button>
                  )}
                </div>
              </Card>
            ))
          )}
        </div>

        {/* Pagination */}
        {pages > 1 && (
          <div className="mt-8 flex justify-center items-center gap-2">
            <Button variant="outline" size="sm" disabled={page<=1} onClick={() => setPage(p=>p-1)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm text-gray-600">Page {page} of {pages}</span>
            <Button variant="outline" size="sm" disabled={page>=pages} onClick={() => setPage(p=>p+1)}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      {/* Verify Modal */}
      <Modal isOpen={verifyModal.open} onClose={() => setVerifyModal({ open: false })} title="Verify Worker">
        <div className="space-y-4">
          <p className="text-sm text-gray-700">Are you sure you want to verify <strong>{verifyModal.user?.name}</strong> as a worker?</p>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setVerifyModal({ open: false })}>Cancel</Button>
            <Button onClick={() => verify(verifyModal.user!._id)}>Verify</Button>
          </div>
        </div>
      </Modal>

      {/* Deactivate Modal */}
      <Modal isOpen={deactivateModal.open} onClose={() => setDeactivateModal({ open: false })} title="Deactivate User">
        <div className="space-y-4">
          <p className="text-sm text-gray-700">Are you sure you want to deactivate <strong>{deactivateModal.user?.name}</strong>?</p>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Reason (optional)</label>
            <textarea
              rows={3}
              value={deactivateModal.reason || ''}
              onChange={(e)=>setDeactivateModal(m=>({...m, reason: e.target.value}))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter a reason for deactivation"
            />
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setDeactivateModal({ open: false })}>Cancel</Button>
            <Button variant="danger" onClick={() => deactivate(deactivateModal.user!._id)}>Deactivate</Button>
          </div>
        </div>
      </Modal>

      {/* Change Role Modal */}
      <Modal isOpen={editRole.open} onClose={() => setEditRole({ open: false })} title="Change User Role">
        <div className="space-y-4">
          <p className="text-sm text-gray-700">Select a new role for <strong>{editRole.user?.name}</strong>.</p>
          <select
            value={editRole.newRole}
            onChange={(e)=> setEditRole(m=>({ ...m, newRole: e.target.value as UserItem['role'] }))}
            className="w-full border rounded px-3 py-2 bg-white"
          >
            {Roles.map(r => <option key={r} value={r}>{r.replace('_',' ')}</option>)}
          </select>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setEditRole({ open: false })}>Cancel</Button>
            <Button onClick={async ()=>{
              if (!editRole.user || !editRole.newRole) return;
              await adminAPI.updateUser(editRole.user._id, { role: editRole.newRole });
              setEditRole({ open: false });
              load();
            }}>
              <RefreshCcw className="h-4 w-4 mr-1"/> Update Role
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default AdminUsersPage;
