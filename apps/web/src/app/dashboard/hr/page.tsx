'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Users, Calendar, Coins } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';

export default function HRDashboard() {
    const { getToken } = useAuth();
    const [employees, setEmployees] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const token = await getToken();
            if (!token) return;

            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/hr/employees`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.ok) {
                const data = await res.json();
                setEmployees(data);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Human Resources</h1>
                    <p className="text-gray-500">Manage employees, leave requests, and advances.</p>
                </div>
                <Button className="gap-2">
                    <Plus className="h-4 w-4" /> Add Employee
                </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-gray-500">Total Employees</CardTitle>
                        <Users className="h-4 w-4 text-gray-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{employees.length}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-gray-500">Pending Leave Requests</CardTitle>
                        <Calendar className="h-4 w-4 text-gray-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">0</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-gray-500">Pending Advances</CardTitle>
                        <Coins className="h-4 w-4 text-gray-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">0</div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Staff Directory</CardTitle>
                    <CardDescription>All active employees in your organization.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Role</TableHead>
                                    <TableHead>Department</TableHead>
                                    <TableHead className="text-right">Base Salary (TZS)</TableHead>
                                    <TableHead>Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center h-24">Loading employees...</TableCell>
                                    </TableRow>
                                ) : employees.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center h-24 text-gray-500">
                                            No employees found. Add your first team member to get started.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    employees.map((emp) => (
                                        <TableRow key={emp.id}>
                                            <TableCell className="font-medium">{emp.firstName} {emp.lastName}</TableCell>
                                            <TableCell>{emp.role}</TableCell>
                                            <TableCell>{emp.department || '-'}</TableCell>
                                            <TableCell className="text-right font-medium text-green-600">
                                                {formatCurrency(Number(emp.baseSalary))}
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                                    Active
                                                </Badge>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
