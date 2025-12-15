"use client";

import { useState, useEffect } from "react";
import { adminApi } from "@/lib/api";
import { BookingWithDetails } from "@/types";
import { DataTable } from "@/components/admin/data-table";
import { Badge } from "@/components/ui/badge";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { format, parseISO } from "date-fns";

export default function AdminBookingsPage() {
    const [bookings, setBookings] = useState<BookingWithDetails[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState<string>("all");

    useEffect(() => {
        fetchBookings();
    }, [statusFilter]);

    const fetchBookings = async () => {
        try {
            setIsLoading(true);
            // In real app: const response = await adminApi.getAllBookings({ status: statusFilter === 'all' ? undefined : statusFilter });

            // Mock data
            setBookings([
                {
                    id: "1", status: "confirmed", userId: "1", scheduleId: "1", createdAt: "2023-12-01T10:00:00Z", updatedAt: "",
                    schedule: { id: "1", date: "2023-12-15", startTime: "10:00", endTime: "11:00", capacity: 20, bookedCount: 5, class: { name: "HIIT" } as any, trainer: { name: "Mike" } as any } as any,
                    class: { name: "HIIT", category: "cardio" } as any
                } as any,
                {
                    id: "2", status: "cancelled", userId: "2", scheduleId: "1", createdAt: "2023-12-02T11:00:00Z", updatedAt: "",
                    schedule: { id: "1", date: "2023-12-15", startTime: "10:00", endTime: "11:00", capacity: 20, bookedCount: 5, class: { name: "HIIT" } as any, trainer: { name: "Mike" } as any } as any,
                    class: { name: "HIIT", category: "cardio" } as any
                } as any,
            ]);
        } catch (error) {
            console.error("Failed to fetch bookings:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const statusColors = {
        pending: "secondary",
        confirmed: "default", // primary/black
        completed: "outline",
        cancelled: "destructive",
        waitlisted: "secondary"
    };

    const columns = [
        {
            header: "Class (Date)",
            accessorKey: (booking: BookingWithDetails) => (
                <div>
                    <p className="font-medium">{booking.class.name}</p>
                    <p className="text-xs text-muted-foreground">
                        {format(parseISO(booking.schedule.date), 'MMM d')} • {booking.schedule.startTime}
                    </p>
                </div>
            )
        },
        {
            header: "User",
            accessorKey: (booking: BookingWithDetails) => booking.userId // Changed from string to function
        },
        {
            header: "Status",
            accessorKey: (booking: BookingWithDetails) => (
                <Badge variant={statusColors[booking.status] as any || "outline"}>
                    {booking.status}
                </Badge>
            )
        },
        {
            header: "Booked On",
            accessorKey: (booking: BookingWithDetails) => format(parseISO(booking.createdAt), 'MMM d, yy HH:mm')
        }
    ];

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold gradient-text">All Bookings</h1>

                <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="All Statuses" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Statuses</SelectItem>
                        <SelectItem value="confirmed">Confirmed</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                        <SelectItem value="waitlisted">Waitlisted</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <DataTable
                data={bookings}
                columns={columns}
                isLoading={isLoading}
            />
        </div>
    );
}
