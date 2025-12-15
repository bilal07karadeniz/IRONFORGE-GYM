"use client";

import { GymClass } from "@/types";
import { Card } from "../ui/card";
import { CategoryBadge } from "../ui/category-badge";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Clock, Users, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface ClassCardProps {
    gymClass: GymClass;
    className?: string;
}

export function ClassCard({ gymClass, className }: ClassCardProps) {
    const enrollmentPercentage = (gymClass.enrolled / gymClass.capacity) * 100;
    const isNearlyFull = enrollmentPercentage >= 80;

    const trainerInitials = gymClass.trainer.name
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase();

    return (
        <Link href={`/classes/${gymClass.id}`} className="block group">
            <Card className={cn(
                "overflow-hidden border-border bg-card transition-all duration-300",
                "hover:scale-[1.02] hover:border-primary hover:shadow-xl hover:shadow-primary/20",
                "group-hover:glow-lime",
                className
            )}>
                {/* Image with gradient overlay */}
                <div className="relative h-48 overflow-hidden">
                    <img
                        src={gymClass.image}
                        alt={gymClass.name}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-card via-card/50 to-transparent" />

                    {/* Category badge */}
                    <div className="absolute top-3 right-3">
                        <CategoryBadge category={gymClass.category} />
                    </div>

                    {/* Popularity indicator */}
                    {gymClass.popularity > 80 && (
                        <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 bg-primary/90 backdrop-blur-sm rounded-full">
                            <TrendingUp className="h-3.5 w-3.5 text-primary-foreground" />
                            <span className="text-xs font-semibold text-primary-foreground">Popular</span>
                        </div>
                    )}
                </div>

                {/* Content */}
                <div className="p-5 space-y-4">
                    {/* Class name */}
                    <h3 className="font-semibold text-lg text-foreground line-clamp-1 group-hover:text-primary transition-colors">
                        {gymClass.name}
                    </h3>

                    {/* Trainer info */}
                    <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8 ring-2 ring-border group-hover:ring-primary transition-colors">
                            <AvatarImage src={gymClass.trainer.avatar} alt={gymClass.trainer.name} />
                            <AvatarFallback className="text-xs bg-muted">
                                {trainerInitials}
                            </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground line-clamp-1">
                                {gymClass.trainer.name}
                            </p>
                            <p className="text-xs text-muted-foreground line-clamp-1">
                                {gymClass.trainer.specialization}
                            </p>
                        </div>
                    </div>

                    {/* Stats */}
                    <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                            <Clock className="h-4 w-4" />
                            <span>{gymClass.duration} min</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                            <Users className="h-4 w-4" />
                            <span>{gymClass.enrolled}/{gymClass.capacity}</span>
                        </div>
                    </div>

                    {/* Enrollment progress bar */}
                    <div className="space-y-1.5">
                        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                            <div
                                className={cn(
                                    "h-full transition-all duration-500 rounded-full",
                                    isNearlyFull ? "bg-destructive" : "bg-primary"
                                )}
                                style={{ width: `${enrollmentPercentage}%` }}
                            />
                        </div>
                        <p className="text-xs text-muted-foreground text-right">
                            {enrollmentPercentage.toFixed(0)}% full
                        </p>
                    </div>
                </div>
            </Card>
        </Link>
    );
}
