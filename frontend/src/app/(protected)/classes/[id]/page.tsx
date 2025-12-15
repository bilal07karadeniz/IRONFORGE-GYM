"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { classesApi } from "@/lib/api";
import { GymClass } from "@/types";
import { CategoryBadge } from "@/components/ui/category-badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
    Clock,
    Users,
    Calendar,
    Star,
    ArrowLeft,
    TrendingUp,
    Award
} from "lucide-react";
import { cn } from "@/lib/utils";

const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export default function ClassDetailPage() {
    const params = useParams();
    const router = useRouter();
    const [gymClass, setGymClass] = useState<GymClass | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (params.id) {
            fetchClassDetails(params.id as string);
        }
    }, [params.id]);

    const fetchClassDetails = async (id: string) => {
        try {
            setIsLoading(true);
            const response = await classesApi.getById(id);
            setGymClass(response.data.data);
        } catch (error) {
            console.error("Failed to fetch class details:", error);
            // For demo, use mock data
            setGymClass(getMockClassById(id));
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) {
        return <ClassDetailSkeleton />;
    }

    if (!gymClass) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="text-center">
                    <h2 className="text-2xl font-bold mb-4">Class not found</h2>
                    <Button onClick={() => router.push("/classes")}>
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back to Classes
                    </Button>
                </div>
            </div>
        );
    }

    const enrollmentPercentage = (gymClass.enrolled / gymClass.capacity) * 100;
    const isNearlyFull = enrollmentPercentage >= 80;
    const spotsLeft = gymClass.capacity - gymClass.enrolled;

    const trainerName = gymClass.trainer?.name || gymClass.trainer?.full_name || 'Unknown';
    const trainerInitials = trainerName
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase();

    return (
        <div className="min-h-screen bg-background">
            {/* Back Button */}
            <div className="container mx-auto px-4 py-6">
                <Button
                    variant="ghost"
                    onClick={() => router.push("/classes")}
                    className="hover:bg-accent"
                >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Classes
                </Button>
            </div>

            {/* Hero Image */}
            <div className="relative h-96 overflow-hidden">
                <img
                    src={gymClass.image}
                    alt={gymClass.name}
                    className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent" />

                {/* Floating Info */}
                <div className="absolute bottom-0 left-0 right-0">
                    <div className="container mx-auto px-4 pb-8">
                        <div className="flex flex-wrap items-end gap-4 mb-4">
                            <CategoryBadge category={gymClass.category} className="text-sm px-4 py-2" />
                            {gymClass.popularity > 80 && (
                                <div className="flex items-center gap-2 px-4 py-2 bg-primary/90 backdrop-blur-sm rounded-full">
                                    <TrendingUp className="h-4 w-4 text-primary-foreground" />
                                    <span className="text-sm font-semibold text-primary-foreground">Popular Class</span>
                                </div>
                            )}
                        </div>
                        <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-2 gradient-text">
                            {gymClass.name}
                        </h1>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="container mx-auto px-4 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Description */}
                        <Card className="p-6 border-border">
                            <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                                <Award className="h-6 w-6 text-primary" />
                                About This Class
                            </h2>
                            <p className="text-muted-foreground leading-relaxed">
                                {gymClass.description}
                            </p>
                        </Card>

                        {/* Trainer Info */}
                        <Card className="p-6 border-border">
                            <h2 className="text-2xl font-semibold mb-6">Meet Your Trainer</h2>
                            <div className="flex items-start gap-4">
                                <Avatar className="h-20 w-20 ring-2 ring-primary">
                                    <AvatarImage src={gymClass.trainer?.avatar} alt={trainerName} />
                                    <AvatarFallback className="text-xl bg-muted">
                                        {trainerInitials}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="flex-1">
                                    <h3 className="text-xl font-semibold mb-1">{trainerName}</h3>
                                    <p className="text-primary font-medium mb-2">{gymClass.trainer.specialization}</p>
                                    {gymClass.trainer.rating && (
                                        <div className="flex items-center gap-2 mb-3">
                                            <Star className="h-4 w-4 fill-primary text-primary" />
                                            <span className="font-semibold">{gymClass.trainer.rating}</span>
                                            <span className="text-muted-foreground text-sm">rating</span>
                                        </div>
                                    )}
                                    {gymClass.trainer.bio && (
                                        <p className="text-muted-foreground">{gymClass.trainer.bio}</p>
                                    )}
                                </div>
                            </div>
                        </Card>

                        {/* Schedule */}
                        {gymClass.schedule && gymClass.schedule.length > 0 && (
                            <Card className="p-6 border-border">
                                <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                                    <Calendar className="h-6 w-6 text-primary" />
                                    Class Schedule
                                </h2>
                                <div className="space-y-3">
                                    {gymClass.schedule.map((slot) => (
                                        <div
                                            key={slot.id}
                                            className="flex items-center justify-between p-4 bg-muted/50 rounded-lg border border-border"
                                        >
                                            <span className="font-medium">{daysOfWeek[slot.dayOfWeek]}</span>
                                            <span className="text-muted-foreground">
                                                {slot.startTime} - {slot.endTime}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </Card>
                        )}
                    </div>

                    {/* Sidebar */}
                    <div className="lg:col-span-1">
                        <div className="sticky top-24 space-y-4">
                            {/* Quick Stats */}
                            <Card className="p-6 border-border space-y-4">
                                <h3 className="font-semibold text-lg">Class Details</h3>

                                <Separator />

                                <div className="space-y-4">
                                    {/* Duration */}
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-primary/10 rounded-lg">
                                            <Clock className="h-5 w-5 text-primary" />
                                        </div>
                                        <div>
                                            <p className="text-sm text-muted-foreground">Duration</p>
                                            <p className="font-semibold">{gymClass.duration} minutes</p>
                                        </div>
                                    </div>

                                    {/* Capacity */}
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-primary/10 rounded-lg">
                                            <Users className="h-5 w-5 text-primary" />
                                        </div>
                                        <div>
                                            <p className="text-sm text-muted-foreground">Capacity</p>
                                            <p className="font-semibold">
                                                {gymClass.enrolled} / {gymClass.capacity} enrolled
                                            </p>
                                        </div>
                                    </div>

                                    {/* Enrollment Progress */}
                                    <div className="space-y-2">
                                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                                            <div
                                                className={cn(
                                                    "h-full transition-all duration-500 rounded-full",
                                                    isNearlyFull ? "bg-destructive" : "bg-primary"
                                                )}
                                                style={{ width: `${enrollmentPercentage}%` }}
                                            />
                                        </div>
                                        <p className="text-sm text-muted-foreground">
                                            {spotsLeft} {spotsLeft === 1 ? 'spot' : 'spots'} remaining
                                        </p>
                                    </div>
                                </div>

                                <Separator />

                                {/* Book Button */}
                                <Button
                                    size="lg"
                                    className="w-full glow-lime"
                                    disabled={spotsLeft === 0}
                                >
                                    {spotsLeft === 0 ? 'Class Full' : 'Book This Class'}
                                </Button>

                                {isNearlyFull && spotsLeft > 0 && (
                                    <p className="text-sm text-destructive text-center font-medium">
                                        ⚠️ Almost full! Book now
                                    </p>
                                )}
                            </Card>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function ClassDetailSkeleton() {
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

function getMockClassById(id: string): GymClass {
    const mockClasses: Record<string, GymClass> = {
        "1": {
            id: "1",
            name: "Power Yoga Flow",
            description: "Experience the perfect blend of strength, flexibility, and mindfulness in our Power Yoga Flow class. This dynamic session combines traditional yoga poses with flowing movements to build lean muscle, improve balance, and increase flexibility. Suitable for intermediate to advanced practitioners, each class focuses on proper alignment, breath work, and core engagement. You'll leave feeling energized, centered, and accomplished.",
            category: "yoga",
            image: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=1200&q=80",
            trainer: {
                id: "t1",
                name: "Sarah Johnson",
                specialization: "Certified Yoga Instructor",
                avatar: "https://i.pravatar.cc/150?img=1",
                rating: 4.9,
                bio: "Sarah has been practicing yoga for over 15 years and teaching for 8. She specializes in Vinyasa and Power Yoga, helping students build strength while maintaining flexibility and mindfulness."
            },
            duration: 60,
            capacity: 20,
            enrolled: 17,
            popularity: 95,
            schedule: [
                { id: "s1", dayOfWeek: 1, startTime: "07:00", endTime: "08:00" },
                { id: "s2", dayOfWeek: 3, startTime: "07:00", endTime: "08:00" },
                { id: "s3", dayOfWeek: 5, startTime: "07:00", endTime: "08:00" }
            ],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        }
    };

    return mockClasses[id] || mockClasses["1"];
}
