import { useState } from "react";
import { useAdminGetUsers, getAdminGetUsersQueryKey, useAdminUpdateUserStatus } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2, UserCog } from "lucide-react";

export default function Admin() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  const { data: users, isLoading } = useAdminGetUsers({
    query: { queryKey: getAdminGetUsersQueryKey() }
  });

  const updateStatusMutation = useAdminUpdateUserStatus();

  const handleStatusChange = (id: number, status: string) => {
    setUpdatingId(id);
    updateStatusMutation.mutate(
      { id, data: { status } },
      {
        onSuccess: () => {
          toast({ title: "User status updated" });
          queryClient.invalidateQueries({ queryKey: getAdminGetUsersQueryKey() });
          setUpdatingId(null);
        },
        onError: (error) => {
          toast({
            variant: "destructive",
            title: "Update failed",
            description: (error.data as any)?.error || "Could not update user.",
          });
          setUpdatingId(null);
        }
      }
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-lg bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
          <UserCog className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Admin Console</h2>
          <p className="text-sm text-slate-500">Manage platform users and workspace access.</p>
        </div>
      </div>

      <Card className="border-0 shadow-sm bg-white dark:bg-slate-900 overflow-hidden">
        <CardHeader className="border-b bg-slate-50/50 dark:bg-slate-950/50">
          <CardTitle>User Directory</CardTitle>
          <CardDescription>View all registered users and modify their account status.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex justify-center items-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : !users || users.length === 0 ? (
            <div className="text-center py-12 text-slate-500">No users found.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>User</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell>
                      <div className="font-medium">{u.name}</div>
                      <div className="text-sm text-slate-500">{u.email}</div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {u.role}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-slate-500">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Badge variant={
                        u.status === 'active' ? 'default' :
                        u.status === 'inactive' ? 'secondary' : 'destructive'
                      } className={u.status === 'active' ? 'bg-green-500 hover:bg-green-600' : ''}>
                        {u.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end items-center gap-2">
                        {updatingId === u.id && <Loader2 className="w-4 h-4 animate-spin text-slate-400" />}
                        <Select 
                          disabled={updatingId === u.id || u.role === 'admin'} 
                          value={u.status} 
                          onValueChange={(val) => handleStatusChange(u.id, val)}
                        >
                          <SelectTrigger className="w-[130px] h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="inactive">Inactive</SelectItem>
                            <SelectItem value="suspended">Suspended</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
