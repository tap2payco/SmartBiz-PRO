'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Users, Calendar, Coins, Loader2, CheckCircle2, XCircle, Clock, AlertCircle } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { format } from 'date-fns';

export default function HRDashboard() {
    const { getToken } = useAuth();
    const [employees, setEmployees] = useState<any[]>([]);
    const [leaveRequests, setLeaveRequests] = useState<any[]>([]);
    const [advances, setAdvances] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const [isAddEmployeeOpen, setIsAddEmployeeOpen] = useState(false);
    const [isRequestLeaveOpen, setIsRequestLeaveOpen] = useState(false);
    const [isRequestAdvanceOpen, setIsRequestAdvanceOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [empForm, setEmpForm] = useState({ firstName: '', lastName: '', email: '', phone: '', role: '', department: '', baseSalary: 0 });
    const [leaveForm, setLeaveForm] = useState({ employeeId: '', startDate: '', endDate: '', type: 'ANNUAL', reason: '' });
    const [advanceForm, setAdvanceForm] = useState({ employeeId: '', amount: 0, reason: '' });

    useEffect(() => {
        loadData();
    }, [getToken]);

    const loadData = async () => {
        try {
            setLoading(true);
            const token = await getToken();
            if (!token) return;

            const [empRes, leaveRes, advRes] = await Promise.all([
                fetch(`${process.env.NEXT_PUBLIC_API_URL}/hr/employees`, { headers: { 'Authorization': `Bearer ${token}` } }),
                fetch(`${process.env.NEXT_PUBLIC_API_URL}/hr/leave-requests`, { headers: { 'Authorization': `Bearer ${token}` } }),
                fetch(`${process.env.NEXT_PUBLIC_API_URL}/hr/advances`, { headers: { 'Authorization': `Bearer ${token}` } })
            ]);

            if (empRes.ok) setEmployees(await empRes.json());
            if (leaveRes.ok) setLeaveRequests(await leaveRes.json());
            if (advRes.ok) setAdvances(await advRes.json());
        } catch (e) {
            console.error(e);
            toast.error('Failed to load HR data');
        } finally {
            setLoading(false);
        }
    };

    const handleAddEmployee = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const token = await getToken();
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/hr/employees`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(empForm)
            });
            if (res.ok) {
                toast.success('Employee added successfully');
                setIsAddEmployeeOpen(false);
                setEmpForm({ firstName: '', lastName: '', email: '', phone: '', role: '', department: '', baseSalary: 0 });
                loadData();
            }
        } catch (e) { toast.error('Error adding employee'); } finally { setIsSubmitting(false); }
    };

    const handleRequestLeave = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const token = await getToken();
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/hr/leave-requests`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(leaveForm)
            });
            if (res.ok) {
                toast.success('Leave request submitted');
                setIsRequestLeaveOpen(false);
                setLeaveForm({ employeeId: '', startDate: '', endDate: '', type: 'ANNUAL', reason: '' });
                loadData();
            }
        } catch (e) { toast.error('Error submitting leave'); } finally { setIsSubmitting(false); }
    };

    const handleRequestAdvance = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const token = await getToken();
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/hr/advances`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(advanceForm)
            });
            if (res.ok) {
                toast.success('Advance request submitted');
                setIsRequestAdvanceOpen(false);
                setAdvanceForm({ employeeId: '', amount: 0, reason: '' });
                loadData();
            }
        } catch (e) { toast.error('Error submitting advance'); } finally { setIsSubmitting(false); }
    };

    const updateLeaveStatus = async (id: string, status: string) => {
        try {
            const token = await getToken();
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/hr/leave-requests/${id}/status`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ status })
            });
            if (res.ok) {
                toast.success(`Leave request ${status.toLowerCase()}`);
                loadData();
            }
        } catch (e) { toast.error('Error updating status'); }
    };

    if (loading && employees.length === 0) return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-blue-600" /></div>;

    const pendingLeave = leaveRequests.filter(r => r.status === 'PENDING').length;
    const pendingAdvances = advances.filter(r => r.status === 'PENDING').length;

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Human Resources</h1>
                    <p className="text-gray-500">Manage team, leave requests, and staff funds.</p>
                </div>
                <div className="flex gap-2">
                    <Dialog open={isRequestLeaveOpen} onOpenChange={setIsRequestLeaveOpen}>
                        <DialogTrigger asChild>
                            <Button variant="outline" className="gap-2"><Calendar className="h-4 w-4" /> Request Leave</Button>
                        </DialogTrigger>
                        <DialogContent>
                            <form onSubmit={handleRequestLeave} className="space-y-4">
                                <DialogHeader><DialogTitle>Request Leave</DialogTitle><DialogDescription>Submit a new leave application.</DialogDescription></DialogHeader>
                                <div className="space-y-2">
                                    <Label>Employee</Label>
                                    <Select value={leaveForm.employeeId} onValueChange={(v) => setLeaveForm({ ...leaveForm, employeeId: v })}>
                                        <SelectTrigger><SelectValue placeholder="Select Staff" /></SelectTrigger>
                                        <SelectContent>{employees.map(e => <SelectItem key={e.id} value={e.id}>{e.firstName} {e.lastName}</SelectItem>)}</SelectContent>
                                    </Select>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2"><Label>Start Date</Label><Input type="date" required value={leaveForm.startDate} onChange={e => setLeaveForm({ ...leaveForm, startDate: e.target.value })} /></div>
                                    <div className="space-y-2"><Label>End Date</Label><Input type="date" required value={leaveForm.endDate} onChange={e => setLeaveForm({ ...leaveForm, endDate: e.target.value })} /></div>
                                </div>
                                <div className="space-y-2">
                                    <Label>Type</Label>
                                    <Select value={leaveForm.type} onValueChange={(v) => setLeaveForm({ ...leaveForm, type: v })}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="ANNUAL">Annual Leave</SelectItem>
                                            <SelectItem value="SICK">Sick Leave</SelectItem>
                                            <SelectItem value="MATERNITY">Maternity/Paternity</SelectItem>
                                            <SelectItem value="OTHER">Other</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2"><Label>Reason</Label><Textarea value={leaveForm.reason} onChange={e => setLeaveForm({ ...leaveForm, reason: e.target.value })} /></div>
                                <DialogFooter><Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Submitting...' : 'Send Request'}</Button></DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>

                    <Dialog open={isRequestAdvanceOpen} onOpenChange={setIsRequestAdvanceOpen}>
                        <DialogTrigger asChild>
                            <Button variant="outline" className="gap-2"><Coins className="h-4 w-4" /> Request Advance</Button>
                        </DialogTrigger>
                        <DialogContent>
                            <form onSubmit={handleRequestAdvance} className="space-y-4">
                                <DialogHeader><DialogTitle>Fund Advance Request</DialogTitle><DialogDescription>Staff can request salary advances or work funds.</DialogDescription></DialogHeader>
                                <div className="space-y-2">
                                    <Label>Employee</Label>
                                    <Select value={advanceForm.employeeId} onValueChange={(v) => setAdvanceForm({ ...advanceForm, employeeId: v })}>
                                        <SelectTrigger><SelectValue placeholder="Select Staff" /></SelectTrigger>
                                        <SelectContent>{employees.map(e => <SelectItem key={e.id} value={e.id}>{e.firstName} {e.lastName}</SelectItem>)}</SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2"><Label>Amount (TZS)</Label><Input type="number" required value={advanceForm.amount} onChange={e => setAdvanceForm({ ...advanceForm, amount: Number(e.target.value) })} /></div>
                                <div className="space-y-2"><Label>Reason</Label><Textarea required value={advanceForm.reason} onChange={e => setAdvanceForm({ ...advanceForm, reason: e.target.value })} /></div>
                                <DialogFooter><Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Submitting...' : 'Send Request'}</Button></DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>

                    <Dialog open={isAddEmployeeOpen} onOpenChange={setIsAddEmployeeOpen}>
                        <DialogTrigger asChild>
                            <Button className="gap-2 bg-blue-600"><Plus className="h-4 w-4" /> Add Employee</Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-md">
                            <form onSubmit={handleAddEmployee} className="space-y-4">
                                <DialogHeader><DialogTitle>Add New Employee</DialogTitle><DialogDescription>Create a new staff profile.</DialogDescription></DialogHeader>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2"><Label>First Name</Label><Input required value={empForm.firstName} onChange={e => setEmpForm({ ...empForm, firstName: e.target.value })} /></div>
                                    <div className="space-y-2"><Label>Last Name</Label><Input required value={empForm.lastName} onChange={e => setEmpForm({ ...empForm, lastName: e.target.value })} /></div>
                                </div>
                                <div className="space-y-2"><Label>Email</Label><Input type="email" value={empForm.email} onChange={e => setEmpForm({ ...empForm, email: e.target.value })} /></div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2"><Label>Role</Label><Input required placeholder="Manager, Sales..." value={empForm.role} onChange={e => setEmpForm({ ...empForm, role: e.target.value })} /></div>
                                    <div className="space-y-2"><Label>Dept</Label><Input placeholder="Finance..." value={empForm.department} onChange={e => setEmpForm({ ...empForm, department: e.target.value })} /></div>
                                </div>
                                <div className="space-y-2"><Label>Base Monthly Salary (TZS)</Label><Input type="number" required value={empForm.baseSalary} onChange={e => setEmpForm({ ...empForm, baseSalary: Number(e.target.value) })} /></div>
                                <DialogFooter><Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Adding...' : 'Save Employee'}</Button></DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                <Card><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium text-gray-500">Total Staff</CardTitle><Users className="h-4 w-4 text-gray-400" /></CardHeader><CardContent><div className="text-2xl font-bold">{employees.length}</div></CardContent></Card>
                <Card><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium text-gray-500">Pending Leave</CardTitle><Calendar className="h-4 w-4 text-gray-400" /></CardHeader><CardContent><div className="text-2xl font-bold">{pendingLeave}</div></CardContent></Card>
                <Card><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium text-gray-500">Pending Advances</CardTitle><Coins className="h-4 w-4 text-gray-400" /></CardHeader><CardContent><div className="text-2xl font-bold">{pendingAdvances}</div></CardContent></Card>
            </div>

            <Tabs defaultValue="directory" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="directory">Staff Directory</TabsTrigger>
                    <TabsTrigger value="leave">Leave Requests {pendingLeave > 0 && <Badge className="ml-2 h-5 w-5 rounded-full p-0 flex items-center justify-center bg-amber-500">{pendingLeave}</Badge>}</TabsTrigger>
                    <TabsTrigger value="advances">Fund Advances {pendingAdvances > 0 && <Badge className="ml-2 h-5 w-5 rounded-full p-0 flex items-center justify-center bg-blue-500">{pendingAdvances}</Badge>}</TabsTrigger>
                </TabsList>

                <TabsContent value="directory">
                    <Card>
                        <CardHeader><CardTitle>Staff Directory</CardTitle><CardDescription>All active employees.</CardDescription></CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Role</TableHead><TableHead>Dept</TableHead><TableHead className="text-right">Base Salary</TableHead></TableRow></TableHeader>
                                <TableBody>
                                    {employees.map((emp) => (
                                        <TableRow key={emp.id}><TableCell className="font-medium">{emp.firstName} {emp.lastName}</TableCell><TableCell>{emp.role}</TableCell><TableCell>{emp.department || '-'}</TableCell><TableCell className="text-right font-medium text-green-600">{formatCurrency(Number(emp.baseSalary))}</TableCell></TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="leave">
                    <Card>
                        <CardHeader><CardTitle>Leave Management</CardTitle><CardDescription>Approve or reject leave requests from staff.</CardDescription></CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader><TableRow><TableHead>Staff</TableHead><TableHead>Dates</TableHead><TableHead>Type</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
                                <TableBody>
                                    {leaveRequests.map((req) => (
                                        <TableRow key={req.id}>
                                            <TableCell>{employees.find(e => e.id === req.employeeId)?.firstName || 'Staff'}</TableCell>
                                            <TableCell>{format(new Date(req.startDate), 'MMM dd')} - {format(new Date(req.endDate), 'MMM dd')}</TableCell>
                                            <TableCell><Badge variant="outline">{req.type}</Badge></TableCell>
                                            <TableCell>
                                                <Badge variant={req.status === 'APPROVED' ? 'default' : req.status === 'PENDING' ? 'outline' : 'destructive'} className={req.status === 'PENDING' ? 'bg-amber-50 text-amber-700 border-amber-200' : ''}>
                                                    {req.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right gap-2 flex justify-end">
                                                {req.status === 'PENDING' && (
                                                    <>
                                                        <Button size="icon" variant="ghost" className="h-8 w-8 text-green-600" onClick={() => updateLeaveStatus(req.id, 'APPROVED')}><CheckCircle2 className="h-5 w-5" /></Button>
                                                        <Button size="icon" variant="ghost" className="h-8 w-8 text-red-600" onClick={() => updateLeaveStatus(req.id, 'REJECTED')}><XCircle className="h-5 w-5" /></Button>
                                                    </>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {leaveRequests.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={5} className="text-center py-10">
                                                <div className="flex flex-col items-center justify-center text-gray-500">
                                                    <AlertCircle className="h-10 w-10 mb-2 opacity-20" />
                                                    <p>No leave requests found.</p>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="advances">
                    <Card>
                        <CardHeader><CardTitle>Fund Advances</CardTitle><CardDescription>Track money advances requested by staff.</CardDescription></CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader><TableRow><TableHead>Staff</TableHead><TableHead>Amount</TableHead><TableHead>Reason</TableHead><TableHead>Status</TableHead><TableHead>Date Requested</TableHead></TableRow></TableHeader>
                                <TableBody>
                                    {advances.map((adv) => (
                                        <TableRow key={adv.id}>
                                            <TableCell>{employees.find(e => e.id === adv.employeeId)?.firstName || 'Staff'}</TableCell>
                                            <TableCell className="font-medium">{formatCurrency(Number(adv.amount))}</TableCell>
                                            <TableCell className="max-w-xs truncate">{adv.reason}</TableCell>
                                            <TableCell><Badge>{adv.status}</Badge></TableCell>
                                            <TableCell className="text-xs text-gray-500">{format(new Date(adv.createdAt), 'MMM dd, yyyy')}</TableCell>
                                        </TableRow>
                                    ))}
                                    {advances.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={5} className="text-center py-10">
                                                <div className="flex flex-col items-center justify-center text-gray-500">
                                                    <AlertCircle className="h-10 w-10 mb-2 opacity-20" />
                                                    <p>No advances found.</p>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
