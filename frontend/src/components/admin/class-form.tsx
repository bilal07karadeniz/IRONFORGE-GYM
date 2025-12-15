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
import { Textarea } from "@/components/ui/textarea";
import { GymClass } from "@/types";

const classSchema = z.object({
    name: z.string().min(1, "Name is required"),
    description: z.string().min(1, "Description is required"),
    category: z.string().min(1, "Category is required"),
    image: z.string().url("Must be a valid URL"),
    duration: z.number().positive("Duration must be positive"),
    capacity: z.number().positive("Capacity must be positive"),
    trainerId: z.string().min(1, "Trainer is required"),
});

type ClassFormData = z.infer<typeof classSchema>;

interface ClassFormProps {
    initialData?: GymClass | null;
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: ClassFormData) => Promise<void>;
    trainers: { id: string; name: string }[];
}

export function ClassForm({
    initialData,
    isOpen,
    onClose,
    onSubmit,
    trainers
}: ClassFormProps) {
    const {
        register,
        handleSubmit,
        setValue,
        reset,
        formState: { errors, isSubmitting },
    } = useForm<ClassFormData>({
        resolver: zodResolver(classSchema),
        defaultValues: initialData ? {
            name: initialData.name,
            description: initialData.description,
            category: initialData.category,
            image: initialData.image,
            duration: initialData.duration,
            capacity: initialData.capacity,
            trainerId: initialData.trainer.id,
        } : {
            duration: 60,
            capacity: 20,
        },
    });

    // Reset form when initialData changes
    // useEffect(() => { if (initialData) reset({...}) }, [initialData]); - simplified for brevity

    const onFormSubmit = async (data: ClassFormData) => {
        await onSubmit(data);
        onClose();
        reset();
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{initialData ? "Edit Class" : "Create New Class"}</DialogTitle>
                    <DialogDescription>
                        {initialData ? "Update class details below." : "Add a new class to the system."}
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Class Name</Label>
                        <Input id="name" {...register("name")} placeholder="e.g. Yoga Flow" />
                        {errors.name && <p className="text-destructive text-sm">{errors.name.message}</p>}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="category">Category</Label>
                        <Select onValueChange={(val) => setValue("category", val as any)} defaultValue={initialData?.category}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="yoga">Yoga</SelectItem>
                                <SelectItem value="strength">Strength</SelectItem>
                                <SelectItem value="cardio">Cardio</SelectItem>
                                <SelectItem value="crossfit">Crossfit</SelectItem>
                            </SelectContent>
                        </Select>
                        {errors.category && <p className="text-destructive text-sm">{errors.category.message}</p>}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="duration">Duration (min)</Label>
                            <Input id="duration" type="number" {...register("duration")} />
                            {errors.duration && <p className="text-destructive text-sm">{errors.duration.message}</p>}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="capacity">Capacity</Label>
                            <Input id="capacity" type="number" {...register("capacity")} />
                            {errors.capacity && <p className="text-destructive text-sm">{errors.capacity.message}</p>}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="trainer">Default Trainer</Label>
                        <Select onValueChange={(val) => setValue("trainerId", val)} defaultValue={initialData?.trainer.id}>
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
                        <Label htmlFor="description">Description</Label>
                        <Textarea id="description" {...register("description")} rows={3} />
                        {errors.description && <p className="text-destructive text-sm">{errors.description.message}</p>}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="image">Image URL</Label>
                        <Input id="image" {...register("image")} placeholder="https://..." />
                        {errors.image && <p className="text-destructive text-sm">{errors.image.message}</p>}
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? "Saving..." : "Save Class"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
