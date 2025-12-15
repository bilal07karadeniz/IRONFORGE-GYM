"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { schedulesApi } from "@/lib/api";
import { Schedule, BookingConflict } from "@/types";
import { CategoryBadge } from "@/components/ui/category-badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { CapacityIndicator } from "@/components/ui/capacity-indicator";
import { BookingModal } from "@/components/schedule/booking-modal";
import {
    Calendar,
    Clock,
    ArrowLeft,
    MapPin,
    Award
} from "lucide-react";
import { format, parseISO, isPast } from "date-fns";
import { toast } from "sonner";

export default function ScheduleDetailPage() {
    const params = useParams();
    const router = useRouter();
    const [schedule, setSchedule] = useState<Schedule | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [conflict, setConflict] = useState<BookingConflict | undefined>();
    const [isWaitlist, setIsWaitlist] = useState(false);

    useEffect(() => {
        if (params.id) {
            fetchScheduleDetails(params.id as string);
        }
    }, [params.id]);

    const fetchScheduleDetails = async (id: string) => {
        try {
            setIsLoading(true);
            const response = await schedulesApi.getById(id);
            setSchedule(response.data.data);
        } catch (error) {
            console.error("Failed to fetch schedule details:", error);
            // Use mock data for demo
            setSchedule(getMockSchedule(id));
        } finally {
            setIsLoading(false);
        }
    };

    const handleBookClick = async () => {
        if (!schedule) return;

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

    const handleWaitlistClick = () => {
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
            }

            // Refresh schedule
            await fetchScheduleDetails(scheduleId);
        } catch (error: any) {
            const message = error.response?.data?.message || "Booking failed. Please try again.";
            toast.error("Booking failed", { description: message });
            throw error;
        }
    };

    if (isLoading) {
        return <ScheduleDetailSkeleton />;
    }

    if (!schedule) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="text-center">
                    <h2 className="text-2xl font-bold mb-4">Schedule not found</h2>
                    <Button onClick={() => router.push("/schedule")}>
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back to Schedule
                    </Button>
                </div>
            </div>
        );
    }

    const isFull = schedule.enrolled >= schedule.capacity;
    const isPastSchedule = isPast(parseISO(`${schedule.date}T${schedule.endTime}`));
    const canBook = !isFull && !isPastSchedule;
    const canJoinWaitlist = isFull && !isPastSchedule;

    const trainerName = schedule.trainer?.name || schedule.trainer?.full_name || 'Unknown';
    const trainerInitials = trainerName
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase();

    const formattedDate = format(parseISO(schedule.date), 'EEEE, MMMM d, yyyy');

    return (
        <div className="min-h-screen bg-background">
            {/* Back Button */}
            <div className="container mx-auto px-4 py-6">
                <Button
                    variant="ghost"
                    onClick={() => router.push("/schedule")}
                    className="hover:bg-accent"
                >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Schedule
                </Button>
            </div>

            {/* Hero Image */}
            <div className="relative h-96 overflow-hidden">
                <img
                    src={schedule.class.image}
                    alt={schedule.class.name}
                    className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent" />

                {/* Floating Info */}
                <div className="absolute bottom-0 left-0 right-0">
                    <div className="container mx-auto px-4 pb-8">
                        <div className="flex flex-wrap items-end gap-4 mb-4">
                            <CategoryBadge category={schedule.class.category} className="text-sm px-4 py-2" />
                            {isPastSchedule && (
                                <div className="px-4 py-2 bg-muted rounded-full">
                                    <span className="text-sm font-semibold text-muted-foreground">Past Schedule</span>
                                </div>
                            )}
                            {isFull && !isPastSchedule && (
                                <div className="px-4 py-2 bg-destructive/90 backdrop-blur-sm rounded-full">
                                    <span className="text-sm font-semibold text-destructive-foreground">Class Full</span>
                                </div>
                            )}
                        </div>
                        <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-2 gradient-text">
                            {schedule.class.name}
                        </h1>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="container mx-auto px-4 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Schedule Details */}
                        <Card className="p-6 border-border">
                            <h2 className="text-2xl font-semibold mb-4">Schedule Details</h2>
                            <div className="space-y-4">
                                <div className="flex items-start gap-4">
                                    <div className="p-2 bg-primary/10 rounded-lg">
                                        <Calendar className="h-5 w-5 text-primary" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground mb-1">Date</p>
                                        <p className="font-semibold">{formattedDate}</p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-4">
                                    <div className="p-2 bg-primary/10 rounded-lg">
                                        <Clock className="h-5 w-5 text-primary" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground mb-1">Time</p>
                                        <p className="font-semibold">
                                            {schedule.startTime} - {schedule.endTime}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </Card>

                        {/* Class Description */}
                        <Card className="p-6 border-border">
                            <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                                <Award className="h-6 w-6 text-primary" />
                                About This Class
                            </h2>
                            <p className="text-muted-foreground leading-relaxed">
                                {schedule.class.description}
                            </p>
                        </Card>

                        {/* Trainer Info */}
                        <Card className="p-6 border-border">
                            <h2 className="text-2xl font-semibold mb-6">Your Trainer</h2>
                            <div className="flex items-start gap-4">
                                <Avatar className="h-20 w-20 ring-2 ring-primary">
                                    <AvatarImage src={schedule.trainer?.avatar} alt={trainerName} />
                                    <AvatarFallback className="text-xl bg-muted">
                                        {trainerInitials}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="flex-1">
                                    <h3 className="text-xl font-semibold mb-1">{trainerName}</h3>
                                    <p className="text-primary font-medium mb-2">{schedule.trainer.specialization}</p>
                                    {schedule.trainer.bio && (
                                        <p className="text-muted-foreground">{schedule.trainer.bio}</p>
                                    )}
                                </div>
                            </div>
                        </Card>
                    </div>

                    {/* Sidebar */}
                    <div className="lg:col-span-1">
                        <div className="sticky top-24 space-y-4">
                            {/* Booking Card */}
                            <Card className="p-6 border-border space-y-4">
                                <h3 className="font-semibold text-lg">Capacity</h3>

                                <Separator />

                                <CapacityIndicator
                                    enrolled={schedule.enrolled}
                                    capacity={schedule.capacity}
                                    variant="circular"
                                    size="lg"
                                />

                                <Separator />

                                {/* Action Buttons */}
                                <div className="space-y-2">
                                    {canBook && (
                                        <Button
                                            size="lg"
                                            className="w-full glow-lime"
                                            onClick={handleBookClick}
                                        >
                                            Book This Class
                                        </Button>
                                    )}
                                    {canJoinWaitlist && (
                                        <Button
                                            size="lg"
                                            variant="outline"
                                            className="w-full"
                                            onClick={handleWaitlistClick}
                                        >
                                            Join Waitlist
                                        </Button>
                                    )}
                                    {isPastSchedule && (
                                        <Button
                                            size="lg"
                                            className="w-full"
                                            disabled
                                        >
                                            Past Schedule
                                        </Button>
                                    )}
                                </div>

                                {isFull && canJoinWaitlist && (
                                    <p className="text-sm text-center text-muted-foreground">
                                        Class is full. Join the waitlist to get notified when a spot opens up.
                                    </p>
                                )}
                            </Card>
                        </div>
                    </div>
                </div>
            </div>

            {/* Booking Modal */}
            <BookingModal
                schedule={schedule}
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onConfirm={handleConfirmBooking}
                conflict={conflict}
                isWaitlist={isWaitlist}
            />
        </div>
    );
}

function ScheduleDetailSkeleton() {
    return (
        <div className="min-h-screen bg-background">
            <div className="container mx-auto px-4 py-6">
                <Skeleton className="h-10 w-32" />
            </div>
            <Skeleton className="h-96 w-full" />
            <div className="container mx-auto px-4 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-6">
                        <Skeleton className="h-48 w-full" />
                        <Skeleton className="h-64 w-full" />
                    </div>
                    <div className="lg:col-span-1">
                        <Skeleton className="h-96 w-full" />
                    </div>
                </div>
            </div>
        </div>
    );
}

function getMockSchedule(id: string): Schedule {
    return {
        id: id,
        class: {
            id: "1",
            name: "Power Yoga Flow",
            description: "Experience the perfect blend of strength, flexibility, and mindfulness in our Power Yoga Flow class. This dynamic session combines traditional yoga poses with flowing movements to build lean muscle, improve balance, and increase flexibility. Suitable for intermediate to advanced practitioners, each class focuses on proper alignment, breath work, and core engagement.",
            category: "yoga",
            image: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=1200&q=80",
            trainer: {
                id: "t1",
                name: "Sarah Johnson",
                specialization: "Certified Yoga Instructor",
                avatar: "https://i.pravatar.cc/150?img=1",
                rating: 4.9,
                bio: "Sarah has been practicing yoga for over 15 years and teaching for 8. She specializes in Vinyasa and Power Yoga."
            },
            duration: 60,
            capacity: 20,
            enrolled: 15,
            popularity: 95,
            schedule: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        },
        date: format(new Date(), 'yyyy-MM-dd'),
        startTime: "07:00",
        endTime: "08:00",
        capacity: 20,
        enrolled: 15,
        trainer: {
            id: "t1",
            name: "Sarah Johnson",
            specialization: "Certified Yoga Instructor",
            avatar: "https://i.pravatar.cc/150?img=1",
            rating: 4.9,
            bio: "Sarah has been practicing yoga for over 15 years and teaching for 8. She specializes in Vinyasa and Power Yoga."
        },
        status: "upcoming",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
}
