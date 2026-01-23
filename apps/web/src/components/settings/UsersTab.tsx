'use client'

import { useState, useEffect } from 'react'
import { Plus, Search, User, Mail, Shield, MoreHorizontal, Ban, Trash2, CheckCircle } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { toast } from 'sonner'
import { USER_ROLES } from '@smartbiz/shared'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { InviteUserDialog } from '@/components/settings/users/InviteUserDialog'

interface UserProfile {
    id: string
    email: string
    fullName: string
    role: string
    status: 'ACTIVE' | 'INACTIVE' | 'INVITED'
    lastActiveAt?: string
}

export function UsersTab() {
    const { user, getToken } = useAuth()
    const [searchQuery, setSearchQuery] = useState('')
    const [users, setUsers] = useState<UserProfile[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [inviteDialogOpen, setInviteDialogOpen] = useState(false)
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
    const [userToDelete, setUserToDelete] = useState<UserProfile | null>(null)

    // Filtered users
    const filteredUsers = users.filter(u =>
        u.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email?.toLowerCase().includes(searchQuery.toLowerCase())
    )

    useEffect(() => {
        fetchUsers()
    }, [])

    const fetchUsers = async () => {
        try {
            const token = await getToken()
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/users`, {
                headers: { 'Authorization': `Bearer ${token}` }
            })

            if (res.ok) {
                const data = await res.json()
                setUsers(data)
            }
        } catch (error) {
            console.error('Failed to fetch users:', error)
            // Mock data for UI development if offline/API not ready
            setUsers([
                { id: '1', email: 'admin@smartbiz.com', fullName: 'Admin User', role: 'ADMIN', status: 'ACTIVE', lastActiveAt: new Date().toISOString() },
                { id: '2', email: 'cashier@smartbiz.com', fullName: 'John Doe', role: 'SALES', status: 'ACTIVE', lastActiveAt: new Date(Date.now() - 86400000).toISOString() },
                { id: '3', email: 'manager@smartbiz.com', fullName: 'Jane Smith', role: 'STOREKEEPER', status: 'INVITED' },
            ])
        } finally {
            setIsLoading(false)
        }
    }

    const handleUpdateRole = async (userId: string, newRole: string) => {
        try {
            const token = await getToken()
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/users/${userId}/role`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ role: newRole })
            })

            if (res.ok) {
                toast.success('User role updated')
                setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u))
            } else {
                const err = await res.json()
                toast.error(err.error || 'Failed to update role')
            }
        } catch (error) {
            toast.error('Error updating role')
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">User Management</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Manage access and roles for your organization members</p>
                </div>
                <Button onClick={() => setInviteDialogOpen(true)}>
                    <User className="h-4 w-4 mr-2" />
                    Invite User
                </Button>
            </div>

            <div className="flex bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                        placeholder="Search users by name or email..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                    />
                </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-900">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">User</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Role</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Last Active</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {filteredUsers.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                                    No users found matching your search.
                                </td>
                            </tr>
                        ) : filteredUsers.map((user) => (
                            <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center">
                                        <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 font-medium">
                                            {user.fullName?.[0] || user.email[0].toUpperCase()}
                                        </div>
                                        <div className="ml-4">
                                            <div className="text-sm font-medium text-gray-900 dark:text-white">{user.fullName || 'No Name'}</div>
                                            <div className="text-sm text-gray-500 dark:text-gray-400">{user.email}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <Select
                                        defaultValue={user.role}
                                        onValueChange={(val) => handleUpdateRole(user.id, val)}
                                        disabled={user.role === 'OWNER'}
                                    >
                                        <SelectTrigger className="w-[140px] h-8">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {Object.values(USER_ROLES).map((role) => (
                                                <SelectItem key={role} value={role}>
                                                    {role.replace('_', ' ')}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <Badge
                                        variant={user.status === 'ACTIVE' ? 'default' : 'secondary'}
                                        className={user.status === 'ACTIVE' ? 'bg-green-100 text-green-800 hover:bg-green-200 border-green-200' : ''}
                                    >
                                        {user.status}
                                    </Badge>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                    {user.lastActiveAt ? new Date(user.lastActiveAt).toLocaleDateString() : '-'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem className="text-red-600 focus:text-red-600 cursor-pointer" onClick={() => {
                                                setUserToDelete(user)
                                                setDeleteConfirmOpen(true)
                                            }}>
                                                <Ban className="h-4 w-4 mr-2" />
                                                Deactivate User
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <InviteUserDialog
                open={inviteDialogOpen}
                onOpenChange={setInviteDialogOpen}
                onSuccess={() => {
                    fetchUsers()
                    toast.success('Invitation sent successfully')
                }}
            />

            <ConfirmDialog
                open={deleteConfirmOpen}
                onOpenChange={setDeleteConfirmOpen}
                title="Deactivate User"
                description={`Are you sure you want to deactivate ${userToDelete?.fullName}? They will no longer be able to access the system.`}
                confirmText="Deactivate"
                variant="destructive"
                onConfirm={() => {
                    toast.success('User deactivated (Mock Action)')
                    setDeleteConfirmOpen(false)
                }}
            />
        </div>
    )
}
