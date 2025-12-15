"use client";

import { Schedule } from "@/types";
import { TimeSlotCard } from "./time-slot-card";
import { Button } from "../ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import {
    format,
    startOfWeek,
    addDays,
    isSameDay,
    parseISO,
    addWeeks,
    subWeeks
} from "date-fns";
import { useState } from "react";

interface ScheduleCalendarProps {
    schedules: Schedule[];
    onBook?: (schedule: Schedule) => void;
    onJoinWaitlist?: (schedule: Schedule) => void;
    bookedScheduleIds?: string[];
    className?: string;
}

export function ScheduleCalendar({
    schedules,
    onBook,
    onJoinWaitlist,
    bookedScheduleIds = [],
    className
}: ScheduleCalendarProps) {
    const [currentWeekStart, setCurrentWeekStart] = useState(
        startOfWeek(new Date(), { weekStartsOn: 1 }) // Monday
    );

    const weekDays = Array.from({ length: 7 }, (_, i) => addDays(currentWeekStart, i));

    const goToPreviousWeek = () => {
        setCurrentWeekStart(subWeeks(currentWeekStart, 1));
    };

    const goToNextWeek = () => {
        setCurrentWeekStart(addWeeks(currentWeekStart, 1));
    };

    const goToToday = () => {
        setCurrentWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }));
    };

    const getSchedulesForDay = (day: Date) => {
        return schedules.filter(schedule =>
            isSameDay(parseISO(schedule.date), day)
        ).sort((a, b) => a.startTime.localeCompare(b.startTime));
    };

    const isToday = (day: Date) => isSameDay(day, new Date());

    return (
        <div className={cn("space-y-4", className)}>
            {/* Navigation */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={goToPreviousWeek}
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={goToNextWeek}
                    >
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                    <div className="ml-2 font-semibold text-lg">
                        {format(currentWeekStart, 'MMM d')} - {format(addDays(currentWeekStart, 6), 'MMM d, yyyy')}
                    </div>
                </div>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={goToToday}
                >
                    Today
                </Button>
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {weekDays.map((day, index) => {
                    const daySchedules = getSchedulesForDay(day);
                    const isCurrentDay = isToday(day);

                    return (
                        <div
                            key={index}
                            className={cn(
                                "rounded-lg border border-border bg-card p-4 space-y-3",
                                isCurrentDay && "ring-2 ring-primary border-primary"
                            )}
                        >
                            {/* Day Header */}
                            <div className="flex items-center justify-between">
                                <div>
                                    <div className={cn(
                                        "text-sm font-medium",
                                        isCurrentDay && "text-primary"
                                    )}>
                                        {format(day, 'EEEE')}
                                    </div>
                                    <div className={cn(
                                        "text-2xl font-bold",
                                        isCurrentDay && "text-primary"
                                    )}>
                                        {format(day, 'd')}
                                    </div>
                                </div>
                                {isCurrentDay && (
                                    <div className="px-2 py-1 bg-primary text-primary-foreground text-xs font-medium rounded-full">
                                        Today
                                    </div>
                                )}
                            </div>

                            {/* Schedules for the day */}
                            <div className="space-y-2">
                                {daySchedules.length === 0 ? (
                                    <div className="text-center py-8 text-sm text-muted-foreground">
                                        No classes scheduled
                                    </div>
                                ) : (
                                    daySchedules.map(schedule => (
                                        <TimeSlotCard
                                            key={schedule.id}
                                            schedule={schedule}
                                            onBook={onBook}
                                            onJoinWaitlist={onJoinWaitlist}
                                            isBooked={bookedScheduleIds.includes(schedule.id)}
                                        />
                                    ))
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
