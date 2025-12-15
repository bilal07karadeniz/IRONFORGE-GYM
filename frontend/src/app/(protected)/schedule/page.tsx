"use client";

import { useState, useEffect } from "react";
import { schedulesApi, bookingsApi } from "@/lib/api";
import { Schedule, BookingConflict } from "@/types";
import { ScheduleCalendar } from "@/components/schedule/schedule-calendar";
import { TimeSlotCard } from "@/components/schedule/time-slot-card";
import { BookingModal } from "@/components/schedule/booking-modal";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar as CalendarIcon, List, CalendarDays } from "lucide-react";
import { toast } from "sonner";
import { format, startOfWeek, endOfWeek } from "date-fns";

type ViewMode = "calendar" | "list";

export default function SchedulePage() {
    const [schedules, setSchedules] = useState<Schedule[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [viewMode, setViewMode] = useState<ViewMode>("calendar");
    const [selectedSchedule, setSelectedSchedule] = useState<Schedule | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [conflict, setConflict] = useState<BookingConflict | undefined>();
    const [isWaitlist, setIsWaitlist] = useState(false);
    const [bookedScheduleIds, setBookedScheduleIds] = useState<string[]>([]);

    useEffect(() => {
        fetchSchedules();
        fetchUserBookings();
    }, []);

    const fetchSchedules = async () => {
        try {
            setIsLoading(true);
            const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
            const weekEnd = endOfWeek(new Date(), { weekStartsOn: 1 });

            const response = await schedulesApi.getAll({
                dateFrom: format(weekStart, 'yyyy-MM-dd'),
                dateTo: format(weekEnd, 'yyyy-MM-dd')
            });
            setSchedules(response.data.data || []);
        } catch (error) {
            console.error("Failed to fetch schedules:", error);
            // Use mock data for demo
            setSchedules(getMockSchedules());
        } finally {
            setIsLoading(false);
        }
    };

    const fetchUserBookings = async () => {
        try {
            const response = await bookingsApi.getAll({ status: 'confirmed' });
            const bookings = response.data.data || [];
            setBookedScheduleIds(bookings.map((b: any) => b.scheduleId).filter(Boolean));
        } catch (error) {
            console.error("Failed to fetch bookings:", error);
        }
    };

    const handleBookClick = async (schedule: Schedule) => {
        setSelectedSchedule(schedule);
        setIsWaitlist(false);

        // Check for conflicts
        try {
            const response = await schedulesApi.checkConflicts(schedule.id);
            setConflict(response.data);
        } catch (error) {
            setConflict(undefined);
        }

        setIsModalOpen(true);
    };

    const handleWaitlistClick = (schedule: Schedule) => {
        setSelectedSchedule(schedule);
        setIsWaitlist(true);
        setConflict(undefined);
        setIsModalOpen(true);
    };

    const handleConfirmBooking = async (scheduleId: string) => {
        try {
            if (isWaitlist) {
                await schedulesApi.joinWaitlist(scheduleId);
                toast.success("Joined waitlist successfully!", {
                    description: "We'll notify you when a spot opens up"
                });
            } else {
                await schedulesApi.book(scheduleId);
                toast.success("Booking confirmed!", {
                    description: "Check your bookings page for details"
                });

                // Update booked schedules
                setBookedScheduleIds(prev => [...prev, scheduleId]);
            }

            // Refresh schedules to update capacity
            await fetchSchedules();
        } catch (error: any) {
            const message = error.response?.data?.message || "Booking failed. Please try again.";
            toast.error("Booking failed", { description: message });
            throw error;
        }
    };

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <div className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
                <div className="container mx-auto px-4 py-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <div className="p-2 bg-primary/10 rounded-lg">
                                    <CalendarDays className="h-6 w-6 text-primary" />
                                </div>
                                <h1 className="text-3xl font-bold gradient-text">Schedule</h1>
                            </div>
                            <p className="text-muted-foreground">
                                Browse and book upcoming classes
                            </p>
                        </div>

                        {/* View Toggle */}
                        <div className="flex gap-2 bg-muted p-1 rounded-lg">
                            <Button
                                variant={viewMode === "calendar" ? "default" : "ghost"}
                                size="sm"
                                onClick={() => setViewMode("calendar")}
                                className="gap-2"
                            >
                                <CalendarIcon className="h-4 w-4" />
                                Calendar
                            </Button>
                            <Button
                                variant={viewMode === "list" ? "default" : "ghost"}
                                size="sm"
                                onClick={() => setViewMode("list")}
                                className="gap-2"
                            >
                                <List className="h-4 w-4" />
                                List
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-4 py-8">
                {isLoading ? (
                    <div className="space-y-4">
                        {[...Array(6)].map((_, i) => (
                            <Skeleton key={i} className="h-32 w-full" />
                        ))}
                    </div>
                ) : schedules.length === 0 ? (
                    <div className="text-center py-20">
                        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-muted mb-4">
                            <CalendarDays className="h-10 w-10 text-muted-foreground" />
                        </div>
                        <h3 className="text-xl font-semibold mb-2">No schedules found</h3>
                        <p className="text-muted-foreground">
                            Check back later for upcoming classes
                        </p>
                    </div>
                ) : viewMode === "calendar" ? (
                    <ScheduleCalendar
                        schedules={schedules}
                        onBook={handleBookClick}
                        onJoinWaitlist={handleWaitlistClick}
                        bookedScheduleIds={bookedScheduleIds}
                    />
                ) : (
                    <div className="space-y-4 max-w-3xl mx-auto">
                        {schedules
                            .sort((a, b) => {
                                const dateCompare = a.date.localeCompare(b.date);
                                if (dateCompare !== 0) return dateCompare;
                                return a.startTime.localeCompare(b.startTime);
                            })
                            .map(schedule => (
                                <TimeSlotCard
                                    key={schedule.id}
                                    schedule={schedule}
                                    onBook={handleBookClick}
                                    onJoinWaitlist={handleWaitlistClick}
                                    isBooked={bookedScheduleIds.includes(schedule.id)}
                                />
                            ))}
                    </div>
                )}
            </div>

            {/* Booking Modal */}
            <BookingModal
                schedule={selectedSchedule}
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onConfirm={handleConfirmBooking}
                conflict={conflict}
                isWaitlist={isWaitlist}
            />
        </div>
    );
}

// Mock data for demo
function getMockSchedules(): Schedule[] {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return [
        {
            id: "sch1",
            class: {
                id: "1",
                name: "Power Yoga Flow",
                description: "Dynamic yoga session",
                category: "yoga",
                image: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800&q=80",
                trainer: {
                    id: "t1",
                    name: "Sarah Johnson",
                    specialization: "Yoga Instructor",
                    avatar: "https://i.pravatar.cc/150?img=1",
                    rating: 4.9
                },
                duration: 60,
                capacity: 20,
                enrolled: 15,
                popularity: 95,
                schedule: [],
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            },
            date: format(today, 'yyyy-MM-dd'),
            startTime: "07:00",
            endTime: "08:00",
            capacity: 20,
            enrolled: 15,
            trainer: {
                id: "t1",
                name: "Sarah Johnson",
                specialization: "Yoga Instructor",
                avatar: "https://i.pravatar.cc/150?img=1",
                rating: 4.9
            },
            status: "upcoming",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        },
        {
            id: "sch2",
            class: {
                id: "2",
                name: "HIIT Cardio Blast",
                description: "High-intensity interval training",
                category: "cardio",
                image: "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800&q=80",
                trainer: {
                    id: "t2",
                    name: "Mike Chen",
                    specialization: "Cardio Specialist",
                    avatar: "https://i.pravatar.cc/150?img=12",
                    rating: 4.8
                },
                duration: 45,
                capacity: 25,
                enrolled: 23,
                popularity: 92,
                schedule: [],
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            },
            date: format(today, 'yyyy-MM-dd'),
            startTime: "09:00",
            endTime: "09:45",
            capacity: 25,
            enrolled: 25,
            trainer: {
                id: "t2",
                name: "Mike Chen",
                specialization: "Cardio Specialist",
                avatar: "https://i.pravatar.cc/150?img=12",
                rating: 4.8
            },
            status: "upcoming",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        },
        {
            id: "sch3",
            class: {
                id: "3",
                name: "Strength & Conditioning",
                description: "Build muscle and power",
                category: "strength",
                image: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&q=80",
                trainer: {
                    id: "t3",
                    name: "David Torres",
                    specialization: "Strength Coach",
                    avatar: "https://i.pravatar.cc/150?img=13",
                    rating: 4.7
                },
                duration: 75,
                capacity: 15,
                enrolled: 12,
                popularity: 88,
                schedule: [],
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            },
            date: format(tomorrow, 'yyyy-MM-dd'),
            startTime: "18:00",
            endTime: "19:15",
            capacity: 15,
            enrolled: 8,
            trainer: {
                id: "t3",
                name: "David Torres",
                specialization: "Strength Coach",
                avatar: "https://i.pravatar.cc/150?img=13",
                rating: 4.7
            },
            status: "upcoming",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        }
    ];
}
