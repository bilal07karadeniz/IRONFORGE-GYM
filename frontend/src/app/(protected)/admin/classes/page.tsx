"use client";

import { useState, useEffect } from "react";
import { type GymClass } from "@/types";
import { adminApi, trainersApi } from "@/lib/api";
import { DataTable } from "@/components/admin/data-table";
import { ClassForm } from "@/components/admin/class-form";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { CategoryBadge } from "@/components/ui/category-badge";

export default function AdminClassesPage() {
    const [classes, setClasses] = useState<GymClass[]>([]);
    const [trainers, setTrainers] = useState<{ id: string; name: string }[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingClass, setEditingClass] = useState<GymClass | null>(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setIsLoading(true);
            // In a real app we'd fetch classes from a dedicated endpoint
            // Reuse schedules fetch or specialized class endpoint
            // Using mock for now since exact endpoints depends on backend
            const trainersResp = await trainersApi.getAll();
            setTrainers(trainersResp.data.data || []);

            // Mock classes data
            setClasses([
                {
                    id: "1",
                    name: "Morning HIIT",
                    description: "High intensity interval training to start your day",
                    category: "cardio",
                    image: "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800&q=80",
                    duration: 45,
                    capacity: 20,
                    trainer: { id: "1", name: "Mike Johnson", specialization: "HIIT" },
                    enrolled: 15,
                    popularity: 85,
                    schedule: [],
                    createdAt: "2023-01-01T00:00:00Z",
                    updatedAt: "2023-01-01T00:00:00Z"
                },
                {
                    id: "2",
                    name: "Power Yoga",
                    description: "Strength focused yoga flow",
                    category: "yoga",
                    image: "https://images.unsplash.com/photo-1599901860904-17e6ed7083a0?w=800&q=80",
                    duration: 60,
                    capacity: 15,
                    trainer: { id: "2", name: "Sarah Williams", specialization: "Yoga" },
                    enrolled: 10,
                    popularity: 75,
                    schedule: [],
                    createdAt: "2023-01-01T00:00:00Z",
                    updatedAt: "2023-01-01T00:00:00Z"
                }
            ]);
        } catch (error) {
            console.error("Failed to fetch classes:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreate = () => {
        setEditingClass(null);
        setIsFormOpen(true);
    };

    const handleEdit = (gymClass: GymClass) => {
        setEditingClass(gymClass);
        setIsFormOpen(true);
    };

    const handleDelete = async (gymClass: GymClass) => {
        if (!confirm(`Are you sure you want to delete ${gymClass.name}?`)) return;

        try {
            await adminApi.deleteClass(gymClass.id);
            toast.success("Class deleted successfully");
            setClasses(classes.filter(c => c.id !== gymClass.id));
        } catch (error) {
            toast.error("Failed to delete class");
        }
    };

    const handleSubmit = async (data: any) => {
        try {
            if (editingClass) {
                await adminApi.updateClass(editingClass.id, data);
                toast.success("Class updated successfully");
            } else {
                await adminApi.createClass(data);
                toast.success("Class created successfully");
            }
            fetchData(); // Refresh list
        } catch (error) {
            toast.error(editingClass ? "Failed to update class" : "Failed to create class");
            throw error;
        }
    };

    const columns = [
        { header: "Name", accessorKey: (item: GymClass) => item.name },
        {
            header: "Category",
            accessorKey: (item: GymClass) => <CategoryBadge category={item.category} />
        },
        {
            header: "Trainer",
            accessorKey: (item: GymClass) => item.trainer?.name || item.trainer?.full_name || 'Unknown'
        },
        {
            header: "Duration",
            accessorKey: (item: GymClass) => `${item.duration} min`
        },
        {
            header: "Capacity",
            accessorKey: (item: GymClass) => item.capacity
        },
    ];

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold gradient-text">Classes Management</h1>
                <Button onClick={handleCreate}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Class
                </Button>
            </div>

            <DataTable
                data={classes}
                columns={columns}
                isLoading={isLoading}
                onEdit={handleEdit}
                onDelete={handleDelete}
            />

            <ClassForm
                initialData={editingClass}
                isOpen={isFormOpen}
                onClose={() => setIsFormOpen(false)}
                onSubmit={handleSubmit}
                trainers={trainers}
            />
        </div>
    );
}
