"use client";

import { useState, useEffect } from "react";
import { bookingsApi, schedulesApi } from "@/lib/api";
import { BookingWithDetails, BookingTab } from "@/types";
import { BookingCard } from "@/components/bookings/booking-card";
import { QRCodeDisplay } from "@/components/bookings/qrcode-display";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { BookOpen } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const tabs: { value: BookingTab; label: string }[] = [
    { value: "upcoming", label: "Upcoming" },
    { value: "completed", label: "Completed" },
    { value: "cancelled", label: "Cancelled" },
];

export default function MyBookingsPage() {
    const [bookings, setBookings] = useState<BookingWithDetails[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<BookingTab>("upcoming");
    const [selectedBookingForQR, setSelectedBookingForQR] = useState<BookingWithDetails | null>(null);

    useEffect(() => {
        fetchBookings();
    }, [activeTab]);

    const fetchBookings = async () => {
        try {
            setIsLoading(true);
            const statusMap = {
                upcoming: "confirmed",
                completed: "completed",
                cancelled: "cancelled"
            };

            const response = await bookingsApi.getAll({
                status: statusMap[activeTab]
            });
            setBookings(response.data.data || []);
        } catch (error) {
            console.error("Failed to fetch bookings:", error);
            setBookings([]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCancelBooking = async (bookingId: string) => {
        try {
            await bookingsApi.cancel(bookingId);
            toast.success("Booking cancelled successfully");
            // Refresh bookings
            fetchBookings();
        } catch (error: any) {
            const message = error.response?.data?.message || "Failed to cancel booking";
            toast.error(message);
            throw error;
        }
    };

    const handleRebook = async (classId: string) => {
        toast.info("Redirecting to schedule...");
        // In a real app, navigate to schedule filtered by this class
        window.location.href = `/schedule`;
    };

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <div className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
                <div className="container mx-auto px-4 py-6">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-primary/10 rounded-lg">
                            <BookOpen className="h-6 w-6 text-primary" />
                        </div>
                        <h1 className="text-3xl font-bold gradient-text">My Bookings</h1>
                    </div>
                    <p className="text-muted-foreground">
                        Manage your class bookings and history
                    </p>
                </div>
            </div>

            <div className="container mx-auto px-4 py-8">
                {/* Tabs */}
                <div className="flex gap-2 mb-6 border-b border-border">
                    {tabs.map((tab) => (
                        <button
                            key={tab.value}
                            onClick={() => setActiveTab(tab.value)}
                            className={cn(
                                "px-4 py-2 font-medium transition-colors relative",
                                activeTab === tab.value
                                    ? "text-primary"
                                    : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            {tab.label}
                            {activeTab === tab.value && (
                                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
                            )}
                        </button>
                    ))}
                </div>

                {/* Bookings List */}
                {isLoading ? (
                    <div className="space-y-4">
                        {[...Array(3)].map((_, i) => (
                            <Skeleton key={i} className="h-32" />
                        ))}
                    </div>
                ) : bookings.length === 0 ? (
                    <div className="text-center py-20">
                        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-muted mb-4">
                            <BookOpen className="h-10 w-10 text-muted-foreground" />
                        </div>
                        <h3 className="text-xl font-semibold mb-2">
                            No {activeTab} bookings
                        </h3>
                        <p className="text-muted-foreground mb-6">
                            {activeTab === "upcoming" && "Start your fitness journey by booking a class!"}
                            {activeTab === "completed" && "Complete some classes to see them here"}
                            {activeTab === "cancelled" && "You haven't cancelled any bookings"}
                        </p>
                        {activeTab === "upcoming" && (
                            <Button onClick={() => window.location.href = "/schedule"}>
                                Browse Schedule
                            </Button>
                        )}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-4 max-w-4xl mx-auto">
                        {bookings.map((booking) => (
                            <BookingCard
                                key={booking.id}
                                booking={booking}
                                onCancel={activeTab === "upcoming" ? handleCancelBooking : undefined}
                                onRebook={activeTab === "completed" ? handleRebook : undefined}
                                onViewQR={activeTab === "upcoming" ? setSelectedBookingForQR : undefined}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* QR Code Modal */}
            <Dialog open={!!selectedBookingForQR} onOpenChange={() => setSelectedBookingForQR(null)}>
                <DialogContent className="sm:max-w-md">
                    {selectedBookingForQR && (
                        <QRCodeDisplay booking={selectedBookingForQR} />
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
