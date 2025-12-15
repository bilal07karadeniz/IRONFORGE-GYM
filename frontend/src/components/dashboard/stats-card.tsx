"use client";

import { Card } from "../ui/card";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatsCardProps {
    title: string;
    value: string | number;
    icon: LucideIcon;
    trend?: {
        value: number;
        isPositive: boolean;
    };
    variant?: "default" | "primary" | "success" | "warning";
    className?: string;
}

export function StatsCard({
    title,
    value,
    icon: Icon,
    trend,
    variant = "default",
    className
}: StatsCardProps) {
    const variants = {
        default: "bg-card border-border",
        primary: "bg-primary/10 border-primary/20",
        success: "bg-green-500/10 border-green-500/20",
        warning: "bg-yellow-500/10 border-yellow-500/20"
    };

    const iconVariants = {
        default: "text-muted-foreground",
        primary: "text-primary",
        success: "text-green-500",
        warning: "text-yellow-500"
    };

    return (
        <Card className={cn(
            "p-6 transition-all duration-300 hover:shadow-lg",
            variants[variant],
            className
        )}>
            <div className="flex items-start justify-between">
                <div className="flex-1">
                    <p className="text-sm font-medium text-muted-foreground mb-2">
                        {title}
                    </p>
                    <p className="text-3xl font-bold text-foreground">
                        {value}
                    </p>
                    {trend && (
                        <p className={cn(
                            "text-xs mt-2 flex items-center gap-1",
                            trend.isPositive ? "text-green-500" : "text-red-500"
                        )}>
                            <span>{trend.isPositive ? "+" : ""}{trend.value}%</span>
                            <span className="text-muted-foreground">vs last month</span>
                        </p>
                    )}
                </div>
                <div className={cn(
                    "p-3 rounded-lg",
                    variant === "default" ? "bg-muted" : `${variants[variant]} opacity-50`
                )}>
                    <Icon className={cn("h-6 w-6", iconVariants[variant])} />
                </div>
            </div>
        </Card>
    );
}
