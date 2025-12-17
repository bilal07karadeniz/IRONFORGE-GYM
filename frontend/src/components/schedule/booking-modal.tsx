"use client";

import { useState } from "react";
import { Schedule, BookingConflict } from "@/types";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "../ui/button";
import { CategoryBadge } from "../ui/category-badge";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { CapacityIndicator } from "../ui/capacity-indicator";
import { Separator } from "../ui/separator";
import {
    Calendar,
    Clock,
    User,
    AlertTriangle,
    CheckCircle2,
    Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format, parseISO } from "date-fns";

interface BookingModalProps {
    schedule: Schedule | null;
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (scheduleId: string) => Promise<void>;
    conflict?: BookingConflict;
    isWaitlist?: boolean;
}

export function BookingModal({
    schedule,
    isOpen,
    onClose,
    onConfirm,
    conflict,
    isWaitlist = false
}: BookingModalProps) {
    const [isBooking, setIsBooking] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);

    if (!schedule) return null;

    const trainerName = schedule.trainer?.name || schedule.trainer?.full_name || 'Unknown Trainer';
    const getInitials = (name: string) => {
        if (!name || name.trim().length === 0) return 'UT';
        const parts = name.trim().split(/\s+/).filter(p => p.length > 0);
        if (parts.length >= 2) {
            return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
        }
        return name.slice(0, 2).toUpperCase();
    };
    const trainerInitials = getInitials(trainerName);

    const formattedDate = format(parseISO(schedule.date), 'EEEE, MMMM d, yyyy');

    const handleConfirm = async () => {
        try {
            setIsBooking(true);
            await onConfirm(schedule.id);
            setShowSuccess(true);

            // Show success animation then close
            setTimeout(() => {
                setShowSuccess(false);
                onClose();
            }, 2000);
        } catch (error) {
            console.error("Booking failed:", error);
            setIsBooking(false);
        }
    };

    const handleClose = () => {
        if (!isBooking) {
            setShowSuccess(false);
            onClose();
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-[500px]">
                {showSuccess ? (
                    <div className="flex flex-col items-center justify-center py-8">
                        <div className="relative">
                            <div className="absolute inset-0 bg-primary/20 rounded-full animate-ping" />
                            <div className="relative bg-primary rounded-full p-4">
                                <CheckCircle2 className="h-12 w-12 text-primary-foreground" />
                            </div>
                        </div>
                        <h3 className="text-2xl font-bold mt-6 mb-2">
                            {isWaitlist ? "Joined Waitlist!" : "Booking Confirmed!"}
                        </h3>
                        <p className="text-muted-foreground text-center">
                            {isWaitlist
                                ? "We'll notify you when a spot opens up"
                                : "You're all set for this class"}
                        </p>
                    </div>
                ) : (
                    <>
                        <DialogHeader>
                            <DialogTitle className="text-xl">
                                {isWaitlist ? "Join Waitlist" : "Confirm Booking"}
                            </DialogTitle>
                            <DialogDescription>
                                {isWaitlist
                                    ? "Get notified when a spot becomes available"
                                    : "Review your class details before confirming"}
                            </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-4 py-4">
                            {/* Conflict Warning */}
                            {conflict?.hasConflict && (
                                <div className="flex gap-3 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                                    <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-destructive mb-1">
                                            Booking Conflict Detected
                                        </p>
                                        <p className="text-xs text-destructive/80">
                                            {conflict.message || "You have another class booked at this time"}
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* Class Info */}
                            <div className="space-y-3">
                                <div className="flex items-start gap-3">
                                    <img
                                        src={schedule.class?.image || 'https://placehold.co/80x80?text=Class'}
                                        alt={schedule.class?.name || 'Class'}
                                        className="w-20 h-20 object-cover rounded-lg"
                                    />
                                    <div className="flex-1 min-w-0">
                                        <h4 className="font-semibold text-base mb-1 line-clamp-1">
                                            {schedule.class?.name || 'Unknown Class'}
                                        </h4>
                                        {schedule.class?.category && <CategoryBadge category={schedule.class.category} />}
                                    </div>
                                </div>

                                <Separator />

                                {/* Details Grid */}
                                <div className="space-y-2.5">
                                    <div className="flex items-center gap-3 text-sm">
                                        <Calendar className="h-4 w-4 text-muted-foreground" />
                                        <span className="text-foreground">{formattedDate}</span>
                                    </div>

                                    <div className="flex items-center gap-3 text-sm">
                                        <Clock className="h-4 w-4 text-muted-foreground" />
                                        <span className="text-foreground">
                                            {schedule.startTime} - {schedule.endTime}
                                        </span>
                                    </div>

                                    <div className="flex items-center gap-3 text-sm">
                                        <Avatar className="h-5 w-5 ring-1 ring-border">
                                            <AvatarImage src={schedule.trainer?.avatar} alt={trainerName} />
                                            <AvatarFallback className="text-xs bg-muted">
                                                {trainerInitials}
                                            </AvatarFallback>
                                        </Avatar>
                                        <span className="text-foreground">{trainerName}</span>
                                    </div>
                                </div>

                                <Separator />

                                {/* Capacity */}
                                {!isWaitlist && (
                                    <div>
                                        <p className="text-sm font-medium mb-2">Class Capacity</p>
                                        <CapacityIndicator
                                            enrolled={schedule.enrolled}
                                            capacity={schedule.capacity}
                                            size="md"
                                        />
                                    </div>
                                )}
                            </div>
                        </div>

                        <DialogFooter>
                            <Button
                                variant="outline"
                                onClick={handleClose}
                                disabled={isBooking}
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleConfirm}
                                disabled={isBooking}
                                className={cn(
                                    "min-w-[120px]",
                                    conflict?.hasConflict && "bg-destructive hover:bg-destructive/90"
                                )}
                            >
                                {isBooking ? (
                                    <>
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        {isWaitlist ? "Joining..." : "Booking..."}
                                    </>
                                ) : (
                                    <>
                                        {conflict?.hasConflict ? "Book Anyway" : isWaitlist ? "Join Waitlist" : "Confirm Booking"}
                                    </>
                                )}
                            </Button>
                        </DialogFooter>
                    </>
                )}
            </DialogContent>
        </Dialog>
    );
}
