"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { User } from "@/types";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Card } from "../ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

const profileSchema = z.object({
    full_name: z
        .string()
        .min(1, "Full name is required")
        .min(2, "Full name must be at least 2 characters")
        .max(100, "Full name must be less than 100 characters"),
    phone: z
        .string()
        .optional()
        .refine(
            (val) => !val || (val.length >= 7 && val.length <= 20 && /^[\d\s\-+()]+$/.test(val)),
            "Phone must be 7-20 characters"
        ),
});

type ProfileFormData = z.infer<typeof profileSchema>;

interface ProfileFormProps {
    user: User;
    onUpdate: (data: ProfileFormData) => Promise<void>;
}

// Helper to get initials from full name
function getInitials(fullName?: string | null): string {
    if (!fullName) return "??";
    const parts = fullName.trim().split(/\s+/);
    if (parts.length >= 2) {
        return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }
    return fullName.slice(0, 2).toUpperCase();
}

export function ProfileForm({ user, onUpdate }: ProfileFormProps) {
    const [isLoading, setIsLoading] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<ProfileFormData>({
        resolver: zodResolver(profileSchema),
        defaultValues: {
            full_name: user.full_name,
            phone: user.phone || "",
        },
    });

    const onSubmit = async (data: ProfileFormData) => {
        try {
            setIsLoading(true);
            await onUpdate(data);
            toast.success("Profile updated successfully!");
        } catch (error: unknown) {
            const err = error as { response?: { data?: { message?: string; errors?: Array<{ message: string }> } } };
            const errors = err.response?.data?.errors;
            let message = err.response?.data?.message || "Failed to update profile";
            if (errors && errors.length > 0) {
                message = errors.map(e => e.message).join('. ');
            }
            toast.error(message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Avatar Section */}
            <Card className="p-6">
                <div className="flex items-center gap-6">
                    <Avatar className="h-24 w-24 ring-4 ring-border">
                        <AvatarImage src={user.avatar} alt={user.full_name} />
                        <AvatarFallback className="text-2xl bg-primary/10">
                            {getInitials(user.full_name)}
                        </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                        <h3 className="font-semibold mb-2">Profile Picture</h3>
                        <p className="text-sm text-muted-foreground">
                            Your profile avatar is generated from your name
                        </p>
                    </div>
                </div>
            </Card>

            {/* Personal Information */}
            <Card className="p-6">
                <h3 className="font-semibold mb-4">Personal Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="full_name">Full Name</Label>
                        <Input
                            id="full_name"
                            {...register("full_name")}
                            placeholder="John Doe"
                        />
                        {errors.full_name && (
                            <p className="text-sm text-destructive">{errors.full_name.message}</p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                            id="email"
                            value={user.email}
                            disabled
                            className="bg-muted cursor-not-allowed"
                        />
                        <p className="text-xs text-muted-foreground">Email cannot be changed</p>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="phone">Phone Number</Label>
                        <Input
                            id="phone"
                            {...register("phone")}
                            placeholder="+1 (555) 000-0000"
                            type="tel"
                        />
                        {errors.phone && (
                            <p className="text-sm text-destructive">{errors.phone.message}</p>
                        )}
                    </div>
                </div>
            </Card>

            {/* Submit Button */}
            <div className="flex justify-end">
                <Button type="submit" size="lg" disabled={isLoading} className="min-w-[150px]">
                    {isLoading ? (
                        <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Saving...
                        </>
                    ) : (
                        "Save Changes"
                    )}
                </Button>
            </div>
        </form>
    );
}
