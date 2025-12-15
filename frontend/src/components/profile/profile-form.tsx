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
import { Loader2, Upload } from "lucide-react";
import { toast } from "sonner";

const profileSchema = z.object({
    firstName: z.string().min(1, "First name is required"),
    lastName: z.string().min(1, "Last name is required"),
    phone: z.string().optional(),
    avatar: z.string().optional(),
});

type ProfileFormData = z.infer<typeof profileSchema>;

interface ProfileFormProps {
    user: User;
    onUpdate: (data: ProfileFormData) => Promise<void>;
}

export function ProfileForm({ user, onUpdate }: ProfileFormProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [avatarPreview, setAvatarPreview] = useState(user.avatar || "");

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<ProfileFormData>({
        resolver: zodResolver(profileSchema),
        defaultValues: {
            firstName: user.firstName,
            lastName: user.lastName,
            phone: user.phone || "",
            avatar: user.avatar || "",
        },
    });

    const onSubmit = async (data: ProfileFormData) => {
        try {
            setIsLoading(true);
            await onUpdate(data);
            toast.success("Profile updated successfully!");
        } catch (error: any) {
            const message = error.response?.data?.message || "Failed to update profile";
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
                        <AvatarImage src={avatarPreview || user.avatar} alt={user.firstName} />
                        <AvatarFallback className="text-2xl bg-primary/10">
                            {user.firstName[0]}{user.lastName[0]}
                        </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                        <h3 className="font-semibold mb-2">Profile Picture</h3>
                        <p className="text-sm text-muted-foreground mb-3">
                            Upload a new avatar or enter an image URL
                        </p>
                        <div className="flex gap-2">
                            <Input
                                {...register("avatar")}
                                onChange={(e) => setAvatarPreview(e.target.value)}
                                placeholder="Image URL"
                                className="flex-1"
                            />
                            <Button type="button" variant="outline" size="icon">
                                <Upload className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </div>
            </Card>

            {/* Personal Information */}
            <Card className="p-6">
                <h3 className="font-semibold mb-4">Personal Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="firstName">First Name</Label>
                        <Input
                            id="firstName"
                            {...register("firstName")}
                            placeholder="John"
                        />
                        {errors.firstName && (
                            <p className="text-sm text-destructive">{errors.firstName.message}</p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="lastName">Last Name</Label>
                        <Input
                            id="lastName"
                            {...register("lastName")}
                            placeholder="Doe"
                        />
                        {errors.lastName && (
                            <p className="text-sm text-destructive">{errors.lastName.message}</p>
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
