"use client";

import { useState, useEffect } from "react";
import { schedulesApi } from "@/lib/api";
import { Schedule } from "@/types";
import { Card } from "@/components/ui/card";
import { CategoryBadge } from "@/components/ui/category-badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, Users, X, ListChecks } from "lucide-react";
import { format, parseISO } from "date-fns";
import { toast } from "sonner";

interface WaitlistEntry {
    id: string;
    schedule: Schedule;
    position?: number;
    createdAt: string;
}

export default function WaitingListPage() {
    const [waitlistEntries, setWaitlistEntries] = useState<WaitlistEntry[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchWaitlist();
    }, []);

    const fetchWaitlist = async () => {
        try {
            setIsLoading(true);
            // In a real app, this would be a dedicated endpoint
            // For demo, we'll use empty array
            setWaitlistEntries([]);
        } catch (error) {
            console.error("Failed to fetch waitlist:", error);
            setWaitlistEntries([]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleLeaveWaitlist = async (entryId: string) => {
        try {
            // In a real app, call API to leave waitlist
            toast.success("Left waitlist successfully");
            fetchWaitlist();
        } catch (error: any) {
            const message = error.response?.data?.message || "Failed to leave waitlist";
            toast.error(message);
        }
    };

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <div className="border-b border-border bg-card/50 backdrop-blur-sm">
                <div className="container mx-auto px-4 py-6">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-primary/10 rounded-lg">
                            <ListChecks className="h-6 w-6 text-primary" />
                        </div>
                        <h1 className="text-3xl font-bold gradient-text">Waiting List</h1>
                    </div>
                    <p className="text-muted-foreground">
                        Classes you're waiting to join
                    </p>
                </div>
            </div>

            <div className="container mx-auto px-4 py-8">
                {isLoading ? (
                    <div className="space-y-4 max-w-3xl mx-auto">
                        {[...Array(3)].map((_, i) => (
                            <Skeleton key={i} className="h-32" />
                        ))}
                    </div>
                ) : waitlistEntries.length === 0 ? (
                    <div className="text-center py-20">
                        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-muted mb-4">
                            <ListChecks className="h-10 w-10 text-muted-foreground" />
                        </div>
                        <h3 className="text-xl font-semibold mb-2">No Waitlist Entries</h3>
                        <p className="text-muted-foreground mb-6">
                            You're not on any waiting lists at the moment
                        </p>
                        <Button onClick={() => window.location.href = "/schedule"}>
                            Browse Schedule
                        </Button>
                    </div>
                ) : (
                    <div className="space-y-4 max-w-3xl mx-auto">
                        {waitlistEntries.map((entry) => (
                            <Card key={entry.id} className="p-4">
                                <div className="flex gap-4">
                                    {/* Class Image */}
                                    <img
                                        src={entry.schedule.class.image}
                                        alt={entry.schedule.class.name}
                                        className="w-24 h-24 object-cover rounded-lg"
                                    />

                                    {/* Content */}
                                    <div className="flex-1 space-y-3">
                                        {/* Header */}
                                        <div className="flex items-start justify-between gap-2">
                                            <div>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <h3 className="font-semibold text-lg">
                                                        {entry.schedule.class.name}
                                                    </h3>
                                                    <CategoryBadge category={entry.schedule.class.category} />
                                                </div>
                                                {entry.position && (
                                                    <Badge variant="outline" className="bg-yellow-500/20 text-yellow-500 border-yellow-500/30">
                                                        Position #{entry.position} in queue
                                                    </Badge>
                                                )}
                                            </div>
                                        </div>

                                        {/* Details */}
                                        <div className="grid grid-cols-2 gap-2 text-sm">
                                            <div className="flex items-center gap-2">
                                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                                <span>{format(parseISO(entry.schedule.date), 'EEE, MMM d, yyyy')}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Clock className="h-4 w-4 text-muted-foreground" />
                                                <span>{entry.schedule.startTime} - {entry.schedule.endTime}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Users className="h-4 w-4 text-muted-foreground" />
                                                <span>Full ({entry.schedule.capacity} capacity)</span>
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => handleLeaveWaitlist(entry.id)}
                                            className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
                                        >
                                            <X className="h-4 w-4 mr-2" />
                                            Leave Waitlist
                                        </Button>
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
