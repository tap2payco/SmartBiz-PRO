'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Play, FileText, CheckCircle2 } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';

export default function PayrollDashboard() {
    const { getToken } = useAuth();
    const [runs, setRuns] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isGenerating, setIsGenerating] = useState(false);

    useEffect(() => {
        loadRuns();
    }, []);

    const loadRuns = async () => {
        try {
            setLoading(true);
            const token = await getToken();
            if (!token) return;

            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/payroll/runs`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.ok) {
                const data = await res.json();
                setRuns(data || []);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleGenerateRun = async () => {
        try {
            setIsGenerating(true);
            const token = await getToken();
            if (!token) throw new Error('Not authenticated');

            const now = new Date();
            const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
            const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);

            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/payroll/runs/generate`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    periodStart: firstDay.toISOString(),
                    periodEnd: lastDay.toISOString()
                })
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.message || 'Failed to generate payroll');
            }

            await loadRuns();
            alert('Payroll run generated successfully!');
        } catch (error: any) {
            alert(error.message || 'Failed to generate payroll run. Have you added employees first?');
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Payroll Runs</h1>
                    <p className="text-gray-500">Generate monthly salaries, deduct PAYE, and issue payslips.</p>
                </div>
                <Button onClick={handleGenerateRun} disabled={isGenerating} className="gap-2 bg-indigo-600 hover:bg-indigo-700">
                    <Play className="h-4 w-4" />
                    {isGenerating ? 'Computing...' : 'Generate New Run'}
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Recent Payroll Runs</CardTitle>
                    <CardDescription>History of computed salary periods.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Period</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Total Net Pay (TZS)</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-center h-24">Loading payroll data...</TableCell>
                                    </TableRow>
                                ) : runs.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-center h-24 text-gray-500">
                                            No payroll runs generated yet. Click the button above to calculate the current month's salaries.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    runs.map((run) => (
                                        <TableRow key={run.id}>
                                            <TableCell className="font-medium">
                                                {new Date(run.periodStart).toLocaleDateString()} - {new Date(run.periodEnd).toLocaleDateString()}
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className={
                                                    run.status === 'APPROVED' ? 'bg-green-50 text-green-700 border-green-200' :
                                                        'bg-amber-50 text-amber-700 border-amber-200'
                                                }>
                                                    {run.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right font-bold text-red-600">
                                                {formatCurrency(Number(run.totalAmount))}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button variant="ghost" size="sm" className="h-8 text-indigo-600">
                                                    <FileText className="w-4 h-4 mr-2" />
                                                    View Payslips
                                                </Button>
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
