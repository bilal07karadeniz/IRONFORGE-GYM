"use client";

import { useState, useEffect } from "react";
import { adminApi } from "@/lib/api";
import { User, UserRole } from "@/types";
import { DataTable } from "@/components/admin/data-table";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { toast } from "sonner";
import { format, parseISO } from "date-fns";

export default function AdminUsersPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [roleFilter, setRoleFilter] = useState<string>("all");

    useEffect(() => {
        fetchUsers();
    }, [roleFilter]);

    const fetchUsers = async () => {
        try {
            setIsLoading(true);
            // In a real app passing params to API
            // const response = await adminApi.getUsers({ role: roleFilter === 'all' ? undefined : roleFilter, search: searchTerm });

            // Mock data for demo
            const mockUsers: any[] = [
                {
                    id: "1", full_name: "John Doe", email: "john@example.com",
                    role: "user", membershipType: "premium", createdAt: "2023-01-15T00:00:00Z"
                },
                {
                    id: "2", full_name: "Mike Johnson", email: "mike@gym.com",
                    role: "trainer", createdAt: "2023-02-01T00:00:00Z"
                },
                {
                    id: "3", full_name: "Sarah Admin", email: "sarah@gym.com",
                    role: "admin", createdAt: "2022-12-01T00:00:00Z"
                },
            ];
            setUsers(mockUsers);
        } catch (error) {
            console.error("Failed to fetch users:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleRoleChange = async (userId: string, newRole: string) => {
        try {
            await adminApi.updateUserRole(userId, newRole);
            toast.success("User role updated successfully");
            // Update local state
            setUsers(users.map(u =>
                u.id === userId ? { ...u, role: newRole as UserRole } : u
            ));
        } catch (error) {
            toast.error("Failed to update user role");
        }
    };

    const handleDelete = async (user: User) => {
        if (!confirm(`Are you sure you want to delete ${user.full_name}?`)) return;

        try {
            await adminApi.deleteUser(user.id);
            toast.success("User deleted successfully");
            setUsers(users.filter(u => u.id !== user.id));
        } catch (error) {
            toast.error("Failed to delete user");
        }
    };

    const getInitials = (fullName?: string | null) => {
        if (!fullName) return "??";
        const parts = fullName.trim().split(/\s+/);
        if (parts.length >= 2) {
            return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
        }
        return fullName.slice(0, 2).toUpperCase();
    };

    const filteredUsers = users.filter(user =>
        (user.full_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (user.email || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    const columns = [
        {
            header: "User",
            accessorKey: (user: User) => (
                <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                        <AvatarImage src={user.avatar} />
                        <AvatarFallback>{getInitials(user.full_name)}</AvatarFallback>
                    </Avatar>
                    <div>
                        <p className="font-medium">{user.full_name}</p>
                        <p className="text-xs text-muted-foreground">{user.email}</p>
                    </div>
                </div>
            )
        },
        {
            header: "Role",
            accessorKey: (user: User) => (
                <Select
                    defaultValue={user.role || 'user'}
                    onValueChange={(val) => handleRoleChange(user.id, val)}
                >
                    <SelectTrigger className="h-8 w-32">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="user">User</SelectItem>
                        <SelectItem value="trainer">Trainer</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                </Select>
            )
        },
        {
            header: "Membership",
            accessorKey: (user: User) => (
                user.membershipType ? (
                    <Badge variant="outline" className="uppercase">{user.membershipType}</Badge>
                ) : <span className="text-muted-foreground">-</span>
            )
        },
        {
            header: "Joined",
            accessorKey: (user: User) => format(parseISO(user.createdAt), 'MMM d, yyyy')
        }
    ];

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <h1 className="text-3xl font-bold gradient-text">User Management</h1>

                <div className="flex gap-2 w-full md:w-auto">
                    <div className="relative flex-1 md:w-64">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search users..."
                            className="pl-9"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <Select value={roleFilter} onValueChange={setRoleFilter}>
                        <SelectTrigger className="w-[150px]">
                            <SelectValue placeholder="All Roles" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Roles</SelectItem>
                            <SelectItem value="user">Users</SelectItem>
                            <SelectItem value="trainer">Trainers</SelectItem>
                            <SelectItem value="admin">Admins</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <DataTable
                data={filteredUsers}
                columns={columns}
                isLoading={isLoading}
                onDelete={handleDelete}
            />
        </div>
    );
}
