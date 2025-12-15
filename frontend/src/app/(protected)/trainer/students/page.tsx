"use client";

import { useState, useEffect } from "react";
import { User } from "@/types";
import { DataTable } from "@/components/admin/data-table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Mail, Phone } from "lucide-react";

export default function TrainerStudentsPage() {
    const [students, setStudents] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // In real app, fetch from trainerApi.getStudents()
        setIsLoading(false);
        setStudents([
            { id: "1", firstName: "Alice", lastName: "Wonder", email: "alice@example.com", phone: "555-0123", avatar: "", membershipType: "premium" } as any,
            { id: "2", firstName: "Bob", lastName: "Builder", email: "bob@example.com", phone: "555-9876", avatar: "", membershipType: "basic" } as any,
        ]);
    }, []);

    const columns = [
        {
            header: "Student",
            accessorKey: (user: User) => (
                <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                        <AvatarImage src={user.avatar} />
                        <AvatarFallback>{user.firstName[0]}{user.lastName[0]}</AvatarFallback>
                    </Avatar>
                    <div>
                        <p className="font-medium">{user.firstName} {user.lastName}</p>
                        <p className="text-xs text-muted-foreground">{user.membershipType} member</p>
                    </div>
                </div>
            )
        },
        { header: "Email", accessorKey: (user: User) => user.email },
        { header: "Phone", accessorKey: (user: User) => user.phone },
        {
            header: "Actions",
            accessorKey: (user: User) => (
                <div className="flex gap-2">
                    <Button size="sm" variant="ghost" title="Send Email">
                        <Mail className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="ghost" title="Call">
                        <Phone className="h-4 w-4" />
                    </Button>
                </div>
            )
        }
    ];

    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold mb-8 gradient-text">My Students</h1>
            <DataTable data={students} columns={columns} isLoading={isLoading} />
        </div>
    );
}
