"use client";

import { useState, useEffect } from "react";
import { trainerApi } from "@/lib/api";
import { Schedule } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Users, Clock, ArrowRight } from "lucide-react";
import { format, parseISO } from "date-fns";
import { useRouter } from "next/navigation";

export default function TrainerDashboardPage() {
    const router = useRouter();
    const [upcomingClasses, setUpcomingClasses] = useState<Schedule[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setIsLoading(true);
            // Mock data
            setUpcomingClasses([
                {
                    id: "1", date: "2023-12-15", startTime: "10:00", endTime: "11:00", capacity: 20, bookedCount: 18,
                    class: { name: "Morning HIIT", category: "cardio" } as any,
                    trainer: { id: "current", name: "Me" } as any
                } as any,
                {
                    id: "2", date: "2023-12-16", startTime: "14:00", endTime: "15:00", capacity: 15, bookedCount: 5,
                    class: { name: "Power Lifting", category: "strength" } as any,
                    trainer: { id: "current", name: "Me" } as any
                } as any
            ]);
        } catch (error) {
            console.error("Failed to fetch trainer dashboard:", error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold gradient-text">Trainer Dashboard</h1>
                    <p className="text-muted-foreground">Manage your schedule and students</p>
                </div>
                <Button onClick={() => router.push('/trainer/students')}>
                    View My Students
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Upcoming Classes</CardTitle>
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{upcomingClasses.length}</div>
                        <p className="text-xs text-muted-foreground">Next 7 days</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Total Students</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">23</div>
                        <p className="text-xs text-muted-foreground">Registered in your classes</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Hours Teaching</CardTitle>
                        <Clock className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">12h</div>
                        <p className="text-xs text-muted-foreground">This week</p>
                    </CardContent>
                </Card>
            </div>

            <h2 className="text-xl font-semibold mb-4">Your Upcoming Schedule</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {upcomingClasses.map((schedule) => (
                    <Card key={schedule.id} className="hover:border-primary transition-colors">
                        <CardHeader>
                            <div className="flex justify-between items-start">
                                <div>
                                    <CardTitle>{schedule.class?.name || 'Unknown Class'}</CardTitle>
                                    <p className="text-sm text-muted-foreground mt-1">
                                        {format(parseISO(schedule.date), 'EEEE, MMM d')}
                                    </p>
                                </div>
                                <div className="px-2 py-1 bg-primary/10 rounded text-xs font-medium text-primary uppercase">
                                    {schedule.class?.category || 'N/A'}
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div className="flex items-center gap-2 text-sm">
                                    <Clock className="h-4 w-4 text-muted-foreground" />
                                    <span>{schedule.startTime} - {schedule.endTime}</span>
                                </div>

                                <div className="space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">Capacity</span>
                                        <span className="font-medium">{schedule.enrolled} / {schedule.capacity}</span>
                                    </div>
                                    <div className="h-2 bg-secondary rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-primary transition-all duration-500"
                                            style={{ width: `${(schedule.enrolled / schedule.capacity) * 100}%` }}
                                        />
                                    </div>
                                </div>

                                <Button variant="outline" className="w-full" onClick={() => router.push(`/trainer/students?classId=${schedule.id}`)}>
                                    View Attendees
                                    <ArrowRight className="h-4 w-4 ml-2" />
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
