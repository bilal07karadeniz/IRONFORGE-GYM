"use client";

import { Schedule } from "@/types";
import { Card } from "../ui/card";
import { CategoryBadge } from "../ui/category-badge";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { CapacityIndicator } from "../ui/capacity-indicator";
import { Button } from "../ui/button";
import { Clock, Calendar, User, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { format, parseISO, isPast } from "date-fns";

interface TimeSlotCardProps {
    schedule: Schedule;
    onBook?: (schedule: Schedule) => void;
    onJoinWaitlist?: (schedule: Schedule) => void;
    isBooked?: boolean;
    className?: string;
}

export function TimeSlotCard({
    schedule,
    onBook,
    onJoinWaitlist,
    isBooked = false,
    className
}: TimeSlotCardProps) {
    const isFull = schedule.enrolled >= schedule.capacity;
    const isPastSchedule = isPast(parseISO(`${schedule.date}T${schedule.endTime}`));
    const canBook = !isFull && !isPastSchedule && !isBooked;
    const canJoinWaitlist = isFull && !isPastSchedule && !isBooked;

    const trainerName = schedule.trainer?.name || schedule.trainer?.full_name || 'Unknown';
    const trainerInitials = trainerName
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase();

    const formattedDate = format(parseISO(schedule.date), 'EEE, MMM d');

    return (
        <Card className={cn(
            "overflow-hidden border-border bg-card transition-all duration-300",
            !isPastSchedule && "hover:border-primary hover:shadow-lg hover:shadow-primary/10",
            isPastSchedule && "opacity-60",
            className
        )}>
            <div className="flex gap-4 p-4">
                {/* Time Badge */}
                <div className="flex flex-col items-center justify-center bg-primary/10 rounded-lg px-4 py-3 min-w-[80px]">
                    <Clock className="h-4 w-4 text-primary mb-1" />
                    <span className="text-sm font-bold text-foreground">{schedule.startTime}</span>
                    <span className="text-xs text-muted-foreground">{schedule.endTime}</span>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 space-y-3">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-semibold text-base text-foreground line-clamp-1">
                                    {schedule.class.name}
                                </h3>
                                {isBooked && (
                                    <div className="flex items-center gap-1 px-2 py-0.5 bg-primary/20 rounded-full">
                                        <CheckCircle2 className="h-3 w-3 text-primary" />
                                        <span className="text-xs font-medium text-primary">Booked</span>
                                    </div>
                                )}
                            </div>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <Calendar className="h-3 w-3" />
                                <span>{formattedDate}</span>
                            </div>
                        </div>
                        <CategoryBadge category={schedule.class.category} className="shrink-0" />
                    </div>

                    {/* Trainer */}
                    <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6 ring-1 ring-border">
                            <AvatarImage src={schedule.trainer?.avatar} alt={trainerName} />
                            <AvatarFallback className="text-xs bg-muted">
                                {trainerInitials}
                            </AvatarFallback>
                        </Avatar>
                        <div className="flex items-center gap-1.5 text-xs">
                            <User className="h-3 w-3 text-muted-foreground" />
                            <span className="text-foreground">{trainerName}</span>
                        </div>
                    </div>

                    {/* Capacity */}
                    <CapacityIndicator
                        enrolled={schedule.enrolled}
                        capacity={schedule.capacity}
                        size="sm"
                    />

                    {/* Actions */}
                    <div className="flex gap-2 pt-1">
                        {canBook && onBook && (
                            <Button
                                size="sm"
                                onClick={() => onBook(schedule)}
                                className="flex-1"
                            >
                                Book Now
                            </Button>
                        )}
                        {canJoinWaitlist && onJoinWaitlist && (
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={() => onJoinWaitlist(schedule)}
                                className="flex-1"
                            >
                                Join Waitlist
                            </Button>
                        )}
                        {isPastSchedule && (
                            <Button
                                size="sm"
                                variant="ghost"
                                disabled
                                className="flex-1"
                            >
                                Past Schedule
                            </Button>
                        )}
                        {isBooked && (
                            <Button
                                size="sm"
                                variant="outline"
                                disabled
                                className="flex-1"
                            >
                                Already Booked
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        </Card>
    );
}
