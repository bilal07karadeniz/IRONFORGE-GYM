"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Schedule } from "@/types";

const scheduleSchema = z.object({
    classId: z.string().min(1, "Class is required"),
    trainerId: z.string().min(1, "Trainer is required"),
    date: z.string().min(1, "Date is required"),
    startTime: z.string().min(1, "Start time is required"),
    endTime: z.string().min(1, "End time is required"),
    capacity: z.number().positive("Capacity must be positive"),
});

type ScheduleFormData = z.infer<typeof scheduleSchema>;

interface ScheduleFormProps {
    initialData?: Schedule | null;
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: ScheduleFormData) => Promise<void>;
    classes: { id: string; name: string; capacity: number; duration: number; trainerId: string }[];
    trainers: { id: string; name: string }[];
}

export function ScheduleForm({
    initialData,
    isOpen,
    onClose,
    onSubmit,
    classes,
    trainers
}: ScheduleFormProps) {
    const {
        register,
        handleSubmit,
        setValue,
        watch,
        reset,
        formState: { errors, isSubmitting },
    } = useForm<ScheduleFormData>({
        resolver: zodResolver(scheduleSchema),
        defaultValues: initialData ? {
            classId: initialData.class?.id,
            trainerId: initialData.trainer?.id,
            date: initialData.date,
            startTime: initialData.startTime,
            endTime: initialData.endTime,
            capacity: initialData.capacity,
        } : {
            date: new Date().toISOString().split('T')[0],
            capacity: 20,
        },
    });

    const selectedClassId = watch("classId");

    const onClassChange = (classId: string) => {
        setValue("classId", classId);
        const selectedClass = classes.find(c => c.id === classId);
        if (selectedClass) {
            setValue("capacity", selectedClass.capacity);
            setValue("trainerId", selectedClass.trainerId);
            // Could also auto-calc end time based on start time + duration
        }
    };

    const onFormSubmit = async (data: ScheduleFormData) => {
        await onSubmit(data);
        onClose();
        reset();
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{initialData ? "Edit Schedule" : "Add Schedule"}</DialogTitle>
                    <DialogDescription>
                        Schedule a new class session.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="class">Class</Label>
                        <Select onValueChange={onClassChange} defaultValue={initialData?.class?.id}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select class" />
                            </SelectTrigger>
                            <SelectContent>
                                {classes.map((c) => (
                                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {errors.classId && <p className="text-destructive text-sm">{errors.classId.message}</p>}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="date">Date</Label>
                        <Input id="date" type="date" {...register("date")} />
                        {errors.date && <p className="text-destructive text-sm">{errors.date.message}</p>}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="startTime">Start Time</Label>
                            <Input id="startTime" type="time" {...register("startTime")} />
                            {errors.startTime && <p className="text-destructive text-sm">{errors.startTime.message}</p>}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="endTime">End Time</Label>
                            <Input id="endTime" type="time" {...register("endTime")} />
                            {errors.endTime && <p className="text-destructive text-sm">{errors.endTime.message}</p>}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="trainer">Trainer</Label>
                        <Select onValueChange={(val) => setValue("trainerId", val)} defaultValue={initialData?.trainer?.id}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select trainer" />
                            </SelectTrigger>
                            <SelectContent>
                                {trainers.map((t) => (
                                    <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {errors.trainerId && <p className="text-destructive text-sm">{errors.trainerId.message}</p>}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="capacity">Capacity</Label>
                        <Input id="capacity" type="number" {...register("capacity")} />
                        {errors.capacity && <p className="text-destructive text-sm">{errors.capacity.message}</p>}
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? "Scheduling..." : "Save Schedule"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
