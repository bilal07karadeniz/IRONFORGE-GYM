"use client";

import { cn } from "@/lib/utils";
import { ClassCategory } from "@/types";

interface CategoryBadgeProps {
    category: ClassCategory;
    isActive?: boolean;
    onClick?: () => void;
    className?: string;
}

const categoryConfig: Record<ClassCategory, { label: string; color: string; activeColor: string }> = {
    yoga: {
        label: "Yoga",
        color: "bg-purple-500/10 text-purple-400 border-purple-500/20",
        activeColor: "bg-purple-500 text-white border-purple-500 glow-purple"
    },
    cardio: {
        label: "Cardio",
        color: "bg-red-500/10 text-red-400 border-red-500/20",
        activeColor: "bg-red-500 text-white border-red-500 glow-red"
    },
    strength: {
        label: "Strength",
        color: "bg-orange-500/10 text-orange-400 border-orange-500/20",
        activeColor: "bg-orange-500 text-white border-orange-500 glow-orange"
    },
    flexibility: {
        label: "Flexibility",
        color: "bg-pink-500/10 text-pink-400 border-pink-500/20",
        activeColor: "bg-pink-500 text-white border-pink-500 glow-pink"
    },
    sports: {
        label: "Sports",
        color: "bg-blue-500/10 text-blue-400 border-blue-500/20",
        activeColor: "bg-blue-500 text-white border-blue-500 glow-blue"
    },
    "martial-arts": {
        label: "Martial Arts",
        color: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
        activeColor: "bg-yellow-500 text-white border-yellow-500 glow-yellow"
    },
    dance: {
        label: "Dance",
        color: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
        activeColor: "bg-cyan-500 text-white border-cyan-500 glow-cyan"
    }
};

export function CategoryBadge({
    category,
    isActive = false,
    onClick,
    className
}: CategoryBadgeProps) {
    const config = categoryConfig[category];
    const isInteractive = !!onClick;

    return (
        <button
            type="button"
            onClick={onClick}
            disabled={!isInteractive}
            className={cn(
                "inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium border transition-all duration-300",
                isActive ? config.activeColor : config.color,
                isInteractive && "cursor-pointer hover:scale-105 hover:shadow-lg",
                !isInteractive && "cursor-default",
                className
            )}
        >
            {config.label}
        </button>
    );
}
