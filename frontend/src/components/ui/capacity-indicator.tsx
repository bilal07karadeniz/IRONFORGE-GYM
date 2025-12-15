"use client";

import { cn } from "@/lib/utils";

interface CapacityIndicatorProps {
    enrolled: number;
    capacity: number;
    variant?: "linear" | "circular";
    size?: "sm" | "md" | "lg";
    showText?: boolean;
    className?: string;
}

export function CapacityIndicator({
    enrolled,
    capacity,
    variant = "linear",
    size = "md",
    showText = true,
    className
}: CapacityIndicatorProps) {
    const percentage = Math.min((enrolled / capacity) * 100, 100);
    const spotsLeft = Math.max(capacity - enrolled, 0);
    const isFull = enrolled >= capacity;

    // Color based on capacity
    const getColor = () => {
        if (isFull) return "gray";
        if (percentage >= 90) return "red";
        if (percentage >= 70) return "yellow";
        return "green";
    };

    const color = getColor();

    const colorClasses = {
        green: "bg-green-500",
        yellow: "bg-yellow-500",
        red: "bg-red-500",
        gray: "bg-muted-foreground"
    };

    const textColorClasses = {
        green: "text-green-500",
        yellow: "text-yellow-500",
        red: "text-red-500",
        gray: "text-muted-foreground"
    };

    if (variant === "circular") {
        const sizes = {
            sm: { size: 40, stroke: 3 },
            md: { size: 60, stroke: 4 },
            lg: { size: 80, stroke: 5 }
        };

        const { size: circleSize, stroke } = sizes[size];
        const radius = (circleSize - stroke) / 2;
        const circumference = 2 * Math.PI * radius;
        const offset = circumference - (percentage / 100) * circumference;

        return (
            <div className={cn("flex flex-col items-center gap-2", className)}>
                <div className="relative" style={{ width: circleSize, height: circleSize }}>
                    <svg
                        className="transform -rotate-90"
                        width={circleSize}
                        height={circleSize}
                    >
                        {/* Background circle */}
                        <circle
                            cx={circleSize / 2}
                            cy={circleSize / 2}
                            r={radius}
                            className="fill-none stroke-muted"
                            strokeWidth={stroke}
                        />
                        {/* Progress circle */}
                        <circle
                            cx={circleSize / 2}
                            cy={circleSize / 2}
                            r={radius}
                            className={cn("fill-none transition-all duration-500", colorClasses[color].replace('bg-', 'stroke-'))}
                            strokeWidth={stroke}
                            strokeDasharray={circumference}
                            strokeDashoffset={offset}
                            strokeLinecap="round"
                        />
                    </svg>
                    {/* Center text */}
                    <div className="absolute inset-0 flex items-center justify-center">
                        <span className={cn("font-bold", size === "sm" ? "text-xs" : size === "md" ? "text-sm" : "text-base")}>
                            {percentage.toFixed(0)}%
                        </span>
                    </div>
                </div>
                {showText && (
                    <span className={cn("text-xs", textColorClasses[color])}>
                        {isFull ? "Full" : `${spotsLeft} left`}
                    </span>
                )}
            </div>
        );
    }

    // Linear variant
    return (
        <div className={cn("space-y-1.5", className)}>
            <div className={cn(
                "h-2 bg-muted rounded-full overflow-hidden",
                size === "sm" && "h-1.5",
                size === "lg" && "h-2.5"
            )}>
                <div
                    className={cn(
                        "h-full transition-all duration-500 rounded-full",
                        colorClasses[color]
                    )}
                    style={{ width: `${percentage}%` }}
                />
            </div>
            {showText && (
                <div className="flex justify-between items-center text-xs">
                    <span className="text-muted-foreground">
                        {enrolled} / {capacity}
                    </span>
                    <span className={cn("font-medium", textColorClasses[color])}>
                        {isFull ? "Full" : `${spotsLeft} spot${spotsLeft !== 1 ? 's' : ''} left`}
                    </span>
                </div>
            )}
        </div>
    );
}
