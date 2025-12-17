"use client";

import { BookingWithDetails } from "@/types";
import { QRCodeSVG } from "qrcode.react";
import { Button } from "../ui/button";
import { Card } from "../ui/card";
import { Separator } from "../ui/separator";
import { Download, Calendar, Clock } from "lucide-react";
import { format, parseISO } from "date-fns";

interface QRCodeDisplayProps {
    booking: BookingWithDetails;
    size?: number;
    className?: string;
}

export function QRCodeDisplay({ booking, size = 256, className }: QRCodeDisplayProps) {
    const scheduleDate = booking.schedule?.date || booking.date;
    const scheduleStartTime = booking.schedule?.startTime || '00:00';
    const scheduleEndTime = booking.schedule?.endTime || '00:00';
    const bookingDateTime = parseISO(`${scheduleDate}T${scheduleStartTime}`);
    const formattedDate = format(bookingDateTime, 'EEEE, MMMM d, yyyy');

    // QR code data - typically booking ID or verification code
    const qrData = JSON.stringify({
        bookingId: booking.id,
        userId: booking.userId,
        scheduleId: booking.scheduleId,
        timestamp: new Date().toISOString()
    });

    const downloadQR = () => {
        const svg = document.getElementById('qr-code-svg');
        if (!svg) return;

        const svgData = new XMLSerializer().serializeToString(svg);
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();

        canvas.width = size;
        canvas.height = size;

        img.onload = () => {
            ctx?.drawImage(img, 0, 0);
            const pngFile = canvas.toDataURL('image/png');

            const downloadLink = document.createElement('a');
            downloadLink.download = `booking-qr-${booking.id}.png`;
            downloadLink.href = pngFile;
            downloadLink.click();
        };

        img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
    };

    return (
        <Card className={className}>
            <div className="p-6 space-y-6">
                {/* QR Code */}
                <div className="flex justify-center">
                    <div className="p-4 bg-white rounded-lg">
                        <QRCodeSVG
                            id="qr-code-svg"
                            value={qrData}
                            size={size}
                            level="H"
                            includeMargin
                        />
                    </div>
                </div>

                {/* Booking Details */}
                <div className="space-y-3">
                    <Separator />

                    <div className="text-center">
                        <h3 className="font-semibold text-lg mb-1">{booking.class?.name || 'Class'}</h3>
                        <p className="text-sm text-muted-foreground">{booking.schedule?.trainer?.name || booking.schedule?.trainer?.full_name || 'Unknown'}</p>
                    </div>

                    <Separator />

                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span>{formattedDate}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <span>{scheduleStartTime} - {scheduleEndTime}</span>
                        </div>
                    </div>

                    <Separator />

                    <p className="text-xs text-center text-muted-foreground">
                        Show this QR code at check-in
                    </p>
                </div>

                {/* Download Button */}
                <Button
                    onClick={downloadQR}
                    variant="outline"
                    className="w-full"
                >
                    <Download className="h-4 w-4 mr-2" />
                    Download QR Code
                </Button>
            </div>
        </Card>
    );
}
