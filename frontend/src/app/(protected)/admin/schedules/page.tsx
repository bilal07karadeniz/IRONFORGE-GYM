"use client";

import { useState, useEffect } from "react";
import { type Schedule, type GymClass } from "@/types";
import { adminApi, trainersApi, schedulesApi } from "@/lib/api";
import { DataTable } from "@/components/admin/data-table";
import { ScheduleForm } from "@/components/admin/schedule-form";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { format, parseISO } from "date-fns";

export default function AdminSchedulesPage() {
    const [schedules, setSchedules] = useState<Schedule[]>([]);
    const [classes, setClasses] = useState<any[]>([]); // Simplified type for mock
    const [trainers, setTrainers] = useState<{ id: string; name: string }[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingSchedule, setEditingSchedule] = useState<Schedule | null>(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setIsLoading(true);
            const [schedulesResp, trainersResp] = await Promise.all([
                schedulesApi.getAll({}), // Get all upcoming
                trainersApi.getAll(),
            ]);

            setSchedules(schedulesResp.data.data || []);
            setTrainers(trainersResp.data.data || []);

            // Mock classes since we don't have a direct endpoint yet
            setClasses([
                { id: "1", name: "Morning HIIT", capacity: 20, duration: 45, trainerId: "1" },
                { id: "2", name: "Power Yoga", capacity: 15, duration: 60, trainerId: "2" },
            ]);
        } catch (error) {
            console.error("Failed to fetch schedules:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreate = () => {
        setEditingSchedule(null);
        setIsFormOpen(true);
    };

    const handleEdit = (schedule: Schedule) => {
        setEditingSchedule(schedule);
        setIsFormOpen(true);
    };

    const handleDelete = async (schedule: Schedule) => {
        if (!confirm(`Are you sure you want to delete this schedule?`)) return;

        try {
            await adminApi.deleteSchedule(schedule.id);
            toast.success("Schedule deleted successfully");
            setSchedules(schedules.filter(s => s.id !== schedule.id));
        } catch (error) {
            toast.error("Failed to delete schedule");
        }
    };

    const handleSubmit = async (data: any) => {
        try {
            if (editingSchedule) {
                await adminApi.updateSchedule(editingSchedule.id, data);
                toast.success("Schedule updated successfully");
            } else {
                await adminApi.createSchedule(data);
                toast.success("Schedule created successfully");
            }
            fetchData(); // Refresh list
        } catch (error) {
            toast.error(editingSchedule ? "Failed to update schedule" : "Failed to create schedule");
            throw error;
        }
    };

    const columns = [
        {
            header: "Class",
            accessorKey: (item: Schedule) => item.class.name
        },
        {
            header: "Date",
            accessorKey: (item: Schedule) => format(parseISO(item.date), 'MMM d, yyyy')
        },
        {
            header: "Time",
            accessorKey: (item: Schedule) => `${item.startTime} - ${item.endTime}`
        },
        {
            header: "Trainer",
            accessorKey: (item: Schedule) => item.trainer.name
        },
        {
            header: "Booked",
            accessorKey: (item: Schedule) => `${item.enrolled}/${item.capacity}`
        },
    ];

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold gradient-text">Schedule Management</h1>
                <Button onClick={handleCreate}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Session
                </Button>
            </div>

            <DataTable
                data={schedules}
                columns={columns}
                isLoading={isLoading}
                onEdit={handleEdit}
                onDelete={handleDelete}
            />

            <ScheduleForm
                initialData={editingSchedule}
                isOpen={isFormOpen}
                onClose={() => setIsFormOpen(false)}
                onSubmit={handleSubmit}
                classes={classes}
                trainers={trainers}
            />
        </div>
    );
}
