"use client";

import { cn } from "@/lib/utils";
import { ClassCategory } from "@/types";

interface CategoryBadgeProps {
    category: ClassCategory | null | undefined;
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
    },
    crossfit: {
        label: "CrossFit",
        color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
        activeColor: "bg-emerald-500 text-white border-emerald-500 glow-emerald"
    },
    swimming: {
        label: "Swimming",
        color: "bg-sky-500/10 text-sky-400 border-sky-500/20",
        activeColor: "bg-sky-500 text-white border-sky-500 glow-sky"
    },
    spinning: {
        label: "Spinning",
        color: "bg-amber-500/10 text-amber-400 border-amber-500/20",
        activeColor: "bg-amber-500 text-white border-amber-500 glow-amber"
    },
    pilates: {
        label: "Pilates",
        color: "bg-violet-500/10 text-violet-400 border-violet-500/20",
        activeColor: "bg-violet-500 text-white border-violet-500 glow-violet"
    },
    boxing: {
        label: "Boxing",
        color: "bg-rose-500/10 text-rose-400 border-rose-500/20",
        activeColor: "bg-rose-500 text-white border-rose-500 glow-rose"
    },
    other: {
        label: "Other",
        color: "bg-slate-500/10 text-slate-400 border-slate-500/20",
        activeColor: "bg-slate-500 text-white border-slate-500 glow-slate"
    }
};

// Default fallback for unknown categories
const defaultConfig = {
    label: "Other",
    color: "bg-gray-500/10 text-gray-400 border-gray-500/20",
    activeColor: "bg-gray-500 text-white border-gray-500 glow-gray"
};

/**
 * Get category configuration with fallback for unknown categories
 * Logs warning in development if category is not found
 */
function getCategoryConfig(category: ClassCategory | null | undefined) {
    // Handle null/undefined
    if (!category) {
        if (process.env.NODE_ENV === 'development') {
            console.warn('[CategoryBadge] Category is null or undefined');
        }
        return defaultConfig;
    }

    // Get config, fallback to default if not found
    const config = categoryConfig[category as ClassCategory];

    if (!config) {
        if (process.env.NODE_ENV === 'development') {
            console.warn(`[CategoryBadge] Unknown category: "${category}". Using default config.`);
        }
        return {
            ...defaultConfig,
            label: category.charAt(0).toUpperCase() + category.slice(1).replace(/-/g, ' ')
        };
    }

    return config;
}

export function CategoryBadge({
    category,
    isActive = false,
    onClick,
    className
}: CategoryBadgeProps) {
    const config = getCategoryConfig(category);
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
