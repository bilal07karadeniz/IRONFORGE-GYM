"use client";

import { BookingWithDetails } from "@/types";
import { Card } from "../ui/card";
import { CategoryBadge } from "../ui/category-badge";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import {
    Calendar,
    Clock,
    User,
    QrCode,
    X,
    RotateCcw
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format, parseISO, differenceInHours } from "date-fns";
import { useState } from "react";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "../ui/alert-dialog";

interface BookingCardProps {
    booking: BookingWithDetails;
    onCancel?: (bookingId: string) => Promise<void>;
    onRebook?: (classId: string) => void;
    onViewQR?: (booking: BookingWithDetails) => void;
    className?: string;
}

export function BookingCard({
    booking,
    onCancel,
    onRebook,
    onViewQR,
    className
}: BookingCardProps) {
    const [showCancelDialog, setShowCancelDialog] = useState(false);
    const [isCancelling, setIsCancelling] = useState(false);

    const trainerInitials = booking.schedule.trainer.name
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase();

    const bookingDateTime = parseISO(`${booking.schedule.date}T${booking.schedule.startTime}`);
    const formattedDate = format(bookingDateTime, 'EEE, MMM d, yyyy');
    const hoursUntil = differenceInHours(bookingDateTime, new Date());
    const canCancel = hoursUntil > 2 && booking.status === 'confirmed';

    const statusConfig = {
        confirmed: { label: "Confirmed", className: "bg-green-500/20 text-green-500 border-green-500/30" },
        pending: { label: "Pending", className: "bg-yellow-500/20 text-yellow-500 border-yellow-500/30" },
        cancelled: { label: "Cancelled", className: "bg-red-500/20 text-red-500 border-red-500/30" },
        completed: { label: "Completed", className: "bg-blue-500/20 text-blue-500 border-blue-500/30" },
        waitlisted: { label: "Waitlisted", className: "bg-purple-500/20 text-purple-500 border-purple-500/30" }
    };

    const status = statusConfig[booking.status] || statusConfig.confirmed;

    const handleCancel = async () => {
        if (!onCancel) return;

        try {
            setIsCancelling(true);
            await onCancel(booking.id);
            setShowCancelDialog(false);
        } catch (error) {
            console.error("Failed to cancel booking:", error);
        } finally {
            setIsCancelling(false);
        }
    };

    return (
        <>
            <Card className={cn(
                "overflow-hidden border-border bg-card transition-all duration-300",
                "hover:border-primary hover:shadow-lg hover:shadow-primary/10",
                booking.status === 'cancelled' && "opacity-60",
                className
            )}>
                <div className="flex gap-4 p-4">
                    {/* Class Image */}
                    <div className="shrink-0">
                        <img
                            src={booking.class.image}
                            alt={booking.class.name}
                            className="w-24 h-24 object-cover rounded-lg"
                        />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0 space-y-3">
                        {/* Header */}
                        <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1 flex-wrap">
                                    <h3 className="font-semibold text-base text-foreground line-clamp-1">
                                        {booking.class.name}
                                    </h3>
                                    <Badge variant="outline" className={cn("border", status.className)}>
                                        {status.label}
                                    </Badge>
                                </div>
                                <CategoryBadge category={booking.class.category} className="mb-2" />
                            </div>
                        </div>

                        {/* Details Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                            <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                <span>{formattedDate}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4 text-muted-foreground" />
                                <span>{booking.schedule.startTime} - {booking.schedule.endTime}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Avatar className="h-4 w-4 ring-1 ring-border">
                                    <AvatarImage src={booking.schedule.trainer.avatar} />
                                    <AvatarFallback className="text-xs">{trainerInitials}</AvatarFallback>
                                </Avatar>
                                <span className="line-clamp-1">{booking.schedule.trainer.name}</span>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2 flex-wrap">
                            {booking.status === 'confirmed' && onViewQR && (
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => onViewQR(booking)}
                                >
                                    <QrCode className="h-4 w-4 mr-2" />
                                    QR Code
                                </Button>
                            )}
                            {canCancel && onCancel && (
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => setShowCancelDialog(true)}
                                    className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
                                >
                                    <X className="h-4 w-4 mr-2" />
                                    Cancel
                                </Button>
                            )}
                            {booking.status === 'completed' && onRebook && (
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => onRebook(booking.class.id)}
                                >
                                    <RotateCcw className="h-4 w-4 mr-2" />
                                    Re-book
                                </Button>
                            )}
                            {!canCancel && booking.status === 'confirmed' && hoursUntil > 0 && (
                                <p className="text-xs text-muted-foreground self-center">
                                    Cannot cancel within 2 hours of class
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            </Card>

            {/* Cancel Confirmation Dialog */}
            <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Cancel Booking?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to cancel your booking for {booking.class.name} on {formattedDate}?
                            This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isCancelling}>Keep Booking</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleCancel}
                            disabled={isCancelling}
                            className="bg-destructive hover:bg-destructive/90"
                        >
                            {isCancelling ? "Cancelling..." : "Cancel Booking"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
