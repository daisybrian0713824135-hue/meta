import React, { useEffect, useState, useCallback } from 'react';
import { Search, UserCheck, UserX, Trash2, Eye, Edit2, X, Save } from 'lucide-react';
import { supabase } from '@/db/supabase';
import AdminLayout from '@/components/layouts/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import type { Profile } from '@/types/types';
import { PACKAGE_BADGE_COLORS } from '@/types/types';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const AdminUsers: React.FC = () => {
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [viewUser, setViewUser] = useState<Profile | null>(null);
  const [editUser, setEditUser] = useState<Profile | null>(null);
  const [saving, setSaving] = useState(false);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    let q = supabase.from('profiles').select('*').order('created_at', { ascending: false }).limit(100);
    if (search.trim()) {
      q = q.or(`username.ilike.%${search}%,full_name.ilike.%${search}%,email.ilike.%${search}%`);
    }
    const { data } = await q;
    if (data) setUsers(data as Profile[]);
    setLoading(false);
  }, [search]);

  useEffect(() => { loadUsers(); }, [loadUsers]);

  const handleStatusChange = async (userId: string, newStatus: 'active' | 'inactive' | 'suspended') => {
    const { error } = await supabase.from('profiles').update({ status: newStatus, account_approved: newStatus === 'active' }).eq('id', userId);
    if (error) toast.error('Failed to update status');
    else { toast.success('User status updated'); loadUsers(); }
  };

  const handleDelete = async (userId: string) => {
    if (!confirm('Delete this user? This cannot be undone.')) return;
    const { error } = await supabase.from('profiles').delete().eq('id', userId);
    if (error) toast.error('Failed to delete user');
    else { toast.success('User deleted'); loadUsers(); }
  };

  const handleSaveEdit = async () => {
    if (!editUser) return;
    setSaving(true);
    const { error } = await supabase.from('profiles').update({
      full_name: editUser.full_name,
      email: editUser.email,
      phone: editUser.phone,
      role: editUser.role,
      status: editUser.status,
      package: editUser.package,
    }).eq('id', editUser.id);
    setSaving(false);
    if (error) toast.error('Failed to save changes');
    else { toast.success('User updated'); setEditUser(null); loadUsers(); }
  };

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <h1 className="text-xl md:text-2xl font-bold text-balance">User Management</h1>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search users..." className="pl-9 h-9 w-64" value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <Button onClick={loadUsers} size="sm" variant="outline">Refresh</Button>
          </div>
        </div>

        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full min-w-max">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    {['User', 'Email', 'Phone', 'Status', 'Package', 'Balance', 'Joined', 'Actions'].map(h => (
                      <th key={h} className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <tr key={i}><td colSpan={8} className="py-3 px-4"><Skeleton className="h-10 w-full bg-muted rounded" /></td></tr>
                    ))
                  ) : users.length === 0 ? (
                    <tr><td colSpan={8} className="text-center py-10 text-muted-foreground text-sm">No users found</td></tr>
                  ) : (
                    users.map(u => (
                      <tr key={u.id} className="border-b border-border last:border-0 hover:bg-muted/20">
                        <td className="py-3 px-4 whitespace-nowrap">
                          <div>
                            <p className="text-sm font-semibold">{u.full_name || u.username}</p>
                            <p className="text-xs text-muted-foreground">@{u.username}</p>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-xs text-muted-foreground whitespace-nowrap">{u.email || '—'}</td>
                        <td className="py-3 px-4 text-xs text-muted-foreground whitespace-nowrap">{u.phone || '—'}</td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <Badge className={cn('text-xs capitalize', u.status === 'active' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : u.status === 'suspended' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' : 'bg-muted text-muted-foreground')}>
                            {u.status}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          {u.package ? <Badge className={cn('text-xs capitalize', PACKAGE_BADGE_COLORS[u.package])}>{u.package}</Badge> : <span className="text-xs text-muted-foreground">—</span>}
                        </td>
                        <td className="py-3 px-4 text-sm font-medium whitespace-nowrap">KES {Number(u.withdrawal_balance).toLocaleString()}</td>
                        <td className="py-3 px-4 text-xs text-muted-foreground whitespace-nowrap">{new Date(u.created_at).toLocaleDateString()}</td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <div className="flex items-center gap-1">
                            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setViewUser(u)}>
                              <Eye className="h-3.5 w-3.5" />
                            </Button>
                            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setEditUser(u)}>
                              <Edit2 className="h-3.5 w-3.5" />
                            </Button>
                            {u.status !== 'active' ? (
                              <Button size="icon" variant="ghost" className="h-7 w-7 text-green-600" onClick={() => handleStatusChange(u.id, 'active')}>
                                <UserCheck className="h-3.5 w-3.5" />
                              </Button>
                            ) : (
                              <Button size="icon" variant="ghost" className="h-7 w-7 text-orange-600" onClick={() => handleStatusChange(u.id, 'suspended')}>
                                <UserX className="h-3.5 w-3.5" />
                              </Button>
                            )}
                            <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => handleDelete(u.id)}>
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* View User Dialog */}
        <Dialog open={!!viewUser} onOpenChange={() => setViewUser(null)}>
          <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-lg">
            <DialogHeader><DialogTitle>User Details</DialogTitle></DialogHeader>
            {viewUser && (
              <div className="space-y-3 text-sm">
                {[
                  ['Full Name', viewUser.full_name], ['Username', `@${viewUser.username}`],
                  ['Email', viewUser.email], ['Phone', viewUser.phone],
                  ['Status', viewUser.status], ['Package', viewUser.package],
                  ['Balance', `KES ${Number(viewUser.withdrawal_balance).toLocaleString()}`],
                  ['Total Earnings', `KES ${Number(viewUser.total_earnings).toLocaleString()}`],
                  ['Tasks Completed', viewUser.completed_tasks],
                  ['Referral Code', viewUser.referral_code],
                  ['Joined', new Date(viewUser.created_at).toLocaleDateString()],
                ].map(([label, value]) => (
                  <div key={String(label)} className="flex justify-between gap-4 py-1 border-b border-border last:border-0">
                    <span className="text-muted-foreground shrink-0">{label}</span>
                    <span className="font-medium text-right capitalize">{String(value ?? '—')}</span>
                  </div>
                ))}
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Edit User Dialog */}
        <Dialog open={!!editUser} onOpenChange={() => setEditUser(null)}>
          <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-lg">
            <DialogHeader><DialogTitle>Edit User</DialogTitle></DialogHeader>
            {editUser && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">Full Name</label>
                    <Input className="h-9 px-3" value={editUser.full_name ?? ''} onChange={e => setEditUser({ ...editUser, full_name: e.target.value })} />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">Phone</label>
                    <Input className="h-9 px-3" value={editUser.phone ?? ''} onChange={e => setEditUser({ ...editUser, phone: e.target.value })} />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Status</label>
                  <Select value={editUser.status} onValueChange={v => setEditUser({ ...editUser, status: v as Profile['status'] })}>
                    <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                      <SelectItem value="suspended">Suspended</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Package</label>
                  <Select value={editUser.package ?? 'none'} onValueChange={v => setEditUser({ ...editUser, package: v === 'none' ? null : v as Profile['package'] })}>
                    <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      <SelectItem value="starter">Starter</SelectItem>
                      <SelectItem value="bronze">Bronze</SelectItem>
                      <SelectItem value="silver">Silver</SelectItem>
                      <SelectItem value="gold">Gold</SelectItem>
                      <SelectItem value="vip">VIP</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Role</label>
                  <Select value={editUser.role} onValueChange={v => setEditUser({ ...editUser, role: v as Profile['role'] })}>
                    <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="user">User</SelectItem>
                      <SelectItem value="moderator">Moderator</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="super_admin">Super Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex gap-3">
                  <Button variant="outline" className="flex-1" onClick={() => setEditUser(null)}><X className="h-4 w-4 mr-1" />Cancel</Button>
                  <Button className="flex-1 gradient-bg-primary text-white border-0" onClick={handleSaveEdit} disabled={saving}>
                    <Save className="h-4 w-4 mr-1" />{saving ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
};

export default AdminUsers;
