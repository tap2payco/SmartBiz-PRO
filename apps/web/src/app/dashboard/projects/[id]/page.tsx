'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import {
    ChevronLeft,
    Calendar,
    CheckCircle2,
    Clock,
    Plus,
    User as UserIcon,
    Trash2,
    Layout
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { format } from 'date-fns'
import { toast } from 'sonner'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

export default function ProjectDetailPage() {
    const { id } = useParams()
    const router = useRouter()
    const { getToken } = useAuth()
    const [project, setProject] = useState<any>(null)
    const [employees, setEmployees] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isAddTaskOpen, setIsAddTaskOpen] = useState(false)
    const [isSavingTask, setIsSavingTask] = useState(false)
    const [taskFormData, setTaskFormData] = useState({
        title: '',
        description: '',
        dueDate: '',
        assignedTo: '',
        status: 'PENDING'
    })

    const fetchData = async () => {
        try {
            const token = await getToken()
            const [projRes, empRes] = await Promise.all([
                fetch(`${process.env.NEXT_PUBLIC_API_URL}/projects/${id}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                }),
                fetch(`${process.env.NEXT_PUBLIC_API_URL}/hr/employees`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                })
            ])

            if (projRes.ok) {
                const data = await projRes.json()
                setProject(data.project)
            }
            if (empRes.ok) {
                const data = await empRes.json()
                setEmployees(data.employees || [])
            }
        } catch (error) {
            console.error('Fetch error:', error)
            toast.error('Failed to load project details')
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchData()
    }, [id, getToken])

    const handleAddTask = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsSavingTask(true)
        try {
            const token = await getToken()
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/projects/${id}/tasks`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(taskFormData)
            })

            if (res.ok) {
                toast.success('Task added successfully')
                setIsAddTaskOpen(false)
                setTaskFormData({ title: '', description: '', dueDate: '', assignedTo: '', status: 'PENDING' })
                fetchData()
            }
        } catch (error) {
            toast.error('Failed to add task')
        } finally {
            setIsSavingTask(false)
        }
    }

    const handleUpdateTaskStatus = async (taskId: string, newStatus: string) => {
        try {
            const token = await getToken()
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/projects/tasks/${taskId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ status: newStatus })
            })

            if (res.ok) {
                toast.success('Task status updated')
                fetchData()
            }
        } catch (error) {
            toast.error('Failed to update task')
        }
    }

    const handleDeleteTask = async (taskId: string) => {
        if (!confirm('Are you sure you want to delete this task?')) return
        try {
            const token = await getToken()
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/projects/tasks/${taskId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            })

            if (res.ok) {
                toast.success('Task deleted')
                fetchData()
            }
        } catch (error) {
            toast.error('Failed to delete task')
        }
    }

    if (isLoading) return <div className="p-8 text-center text-muted-foreground">Loading project...</div>
    if (!project) return <div className="p-8 text-center text-red-500">Project not found</div>

    const completedTasks = project.tasks?.filter((t: any) => t.status === 'COMPLETED')?.length || 0
    const totalTasks = project.tasks?.length || 0
    const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

    return (
        <div className="p-6 space-y-6 max-w-6xl mx-auto">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="sm" onClick={() => router.back()}>
                    <ChevronLeft className="h-4 w-4 mr-1" /> Back
                </Button>
                <div className="flex-1">
                    <div className="flex items-center gap-3">
                        <h1 className="text-3xl font-bold">{project.name}</h1>
                        <Badge variant={project.status === 'ACTIVE' ? 'default' : 'secondary'}>{project.status}</Badge>
                    </div>
                    <p className="text-muted-foreground">{project.description || 'No description provided'}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card className="md:col-span-1">
                    <CardHeader>
                        <CardTitle className="text-sm font-medium uppercase text-muted-foreground">Timeline</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center gap-2 text-sm">
                            <Calendar className="h-4 w-4 text-blue-600" />
                            <span className="font-medium">Started:</span>
                            <span>{project.startDate ? format(new Date(project.startDate), 'MMM dd, yyyy') : 'N/A'}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                            <Clock className="h-4 w-4 text-amber-600" />
                            <span className="font-medium">Deadline:</span>
                            <span>{project.endDate ? format(new Date(project.endDate), 'MMM dd, yyyy') : 'N/A'}</span>
                        </div>
                        <Separator />
                        <div className="space-y-2">
                            <div className="flex justify-between text-xs font-medium">
                                <span>Project Progress</span>
                                <span>{progress}%</span>
                            </div>
                            <Progress value={progress} className="h-2" />
                            <p className="text-[10px] text-muted-foreground text-center">
                                {completedTasks} / {totalTasks} tasks completed
                            </p>
                        </div>
                    </CardContent>
                </Card>

                <Card className="md:col-span-3">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle className="text-lg font-semibold flex items-center gap-2">
                            <Layout className="h-5 w-5 text-purple-600" />
                            Project Tasks
                        </CardTitle>
                        <Dialog open={isAddTaskOpen} onOpenChange={setIsAddTaskOpen}>
                            <DialogTrigger asChild>
                                <Button size="sm" className="bg-blue-600">
                                    <Plus className="h-4 w-4 mr-1" /> Add Task
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <form onSubmit={handleAddTask}>
                                    <DialogHeader>
                                        <DialogTitle>Add New Task</DialogTitle>
                                        <DialogDescription>Assign a task to this project.</DialogDescription>
                                    </DialogHeader>
                                    <div className="grid gap-4 py-4">
                                        <div className="space-y-2">
                                            <Label>Title</Label>
                                            <Input required value={taskFormData.title} onChange={e => setTaskFormData({ ...taskFormData, title: e.target.value })} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Description</Label>
                                            <Textarea value={taskFormData.description} onChange={e => setTaskFormData({ ...taskFormData, description: e.target.value })} />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label>Due Date</Label>
                                                <Input type="date" value={taskFormData.dueDate} onChange={e => setTaskFormData({ ...taskFormData, dueDate: e.target.value })} />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Assigned To</Label>
                                                <Select value={taskFormData.assignedTo} onValueChange={val => setTaskFormData({ ...taskFormData, assignedTo: val })}>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select Employee" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {employees.map(emp => (
                                                            <SelectItem key={emp.id} value={emp.id}>{emp.firstName} {emp.lastName}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>
                                    </div>
                                    <DialogFooter>
                                        <Button type="button" variant="outline" onClick={() => setIsAddTaskOpen(false)}>Cancel</Button>
                                        <Button type="submit" disabled={isSavingTask}>{isSavingTask ? 'Adding...' : 'Add Task'}</Button>
                                    </DialogFooter>
                                </form>
                            </DialogContent>
                        </Dialog>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {project.tasks?.length === 0 ? (
                                <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-lg">
                                    No tasks added to this project yet.
                                </div>
                            ) : (
                                project.tasks.map((task: any) => (
                                    <div key={task.id} className="flex items-start gap-4 p-4 border rounded-lg hover:bg-gray-50/50 transition-colors">
                                        <Button
                                            variant="outline"
                                            size="icon"
                                            className={`h-8 w-8 rounded-full ${task.status === 'COMPLETED' ? 'bg-green-100 border-green-200' : ''}`}
                                            onClick={() => handleUpdateTaskStatus(task.id, task.status === 'COMPLETED' ? 'PENDING' : 'COMPLETED')}
                                        >
                                            <CheckCircle2 className={`h-5 w-5 ${task.status === 'COMPLETED' ? 'text-green-600' : 'text-gray-300'}`} />
                                        </Button>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-start">
                                                <h4 className={`font-semibold ${task.status === 'COMPLETED' ? 'line-through text-muted-foreground' : ''}`}>
                                                    {task.title}
                                                </h4>
                                                <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500" onClick={() => handleDeleteTask(task.id)}>
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                            <p className="text-sm text-muted-foreground line-clamp-2 mt-0.5">{task.description}</p>
                                            <div className="flex flex-wrap items-center gap-4 mt-3 text-xs">
                                                {task.dueDate && (
                                                    <div className="flex items-center gap-1 text-gray-500">
                                                        <Clock className="h-3 w-3" />
                                                        Due: {format(new Date(task.dueDate), 'MMM dd')}
                                                    </div>
                                                )}
                                                {task.assignee && (
                                                    <div className="flex items-center gap-1 text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                                                        <UserIcon className="h-3 w-3" />
                                                        {task.assignee.firstName} {task.assignee.lastName}
                                                    </div>
                                                )}
                                                <Badge variant="outline" className="text-[10px] py-0">{task.status}</Badge>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
