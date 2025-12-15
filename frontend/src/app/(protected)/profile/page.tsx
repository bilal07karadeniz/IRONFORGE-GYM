"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { authApi } from "@/lib/api";
import { ProfileForm } from "@/components/profile/profile-form";
import { Card } from "@/components/ui/card";
import { User2 } from "lucide-react";

export default function ProfilePage() {
    const { user, setUser } = useAuth();

    const handleUpdateProfile = async (data: {
        firstName?: string;
        lastName?: string;
        phone?: string;
        avatar?: string;
    }) => {
        const response = await authApi.updateProfile(data);
        // Update user context
        if (response.data.data && setUser) {
            setUser(response.data.data);
        }
    };

    if (!user) {
        return null;
    }

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <div className="border-b border-border bg-card/50 backdrop-blur-sm">
                <div className="container mx-auto px-4 py-6">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-primary/10 rounded-lg">
                            <User2 className="h-6 w-6 text-primary" />
                        </div>
                        <h1 className="text-3xl font-bold gradient-text">Profile Settings</h1>
                    </div>
                    <p className="text-muted-foreground">
                        Manage your personal information and preferences
                    </p>
                </div>
            </div>

            <div className="container mx-auto px-4 py-8">
                <div className="max-w-3xl mx-auto">
                    <ProfileForm user={user} onUpdate={handleUpdateProfile} />
                </div>
            </div>
        </div>
    );
}
