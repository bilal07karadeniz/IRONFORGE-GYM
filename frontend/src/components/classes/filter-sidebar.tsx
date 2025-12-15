"use client";

import { ClassCategory, ClassSortOption } from "@/types";
import { CategoryBadge } from "../ui/category-badge";
import { Button } from "../ui/button";
import { Separator } from "../ui/separator";
import { X, SlidersHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

interface FilterSidebarProps {
    selectedCategory?: ClassCategory;
    onCategoryChange: (category?: ClassCategory) => void;
    sortBy: ClassSortOption;
    onSortChange: (sort: ClassSortOption) => void;
    onClearFilters: () => void;
    className?: string;
    isMobile?: boolean;
    onClose?: () => void;
}

const categories: ClassCategory[] = [
    "yoga",
    "cardio",
    "strength",
    "flexibility",
    "sports",
    "martial-arts",
    "dance"
];

const sortOptions: { value: ClassSortOption; label: string }[] = [
    { value: "name", label: "Name (A-Z)" },
    { value: "popularity", label: "Most Popular" },
    { value: "duration", label: "Duration" }
];

export function FilterSidebar({
    selectedCategory,
    onCategoryChange,
    sortBy,
    onSortChange,
    onClearFilters,
    className,
    isMobile = false,
    onClose
}: FilterSidebarProps) {
    const hasActiveFilters = selectedCategory || sortBy !== "name";

    return (
        <div className={cn(
            "bg-card border-border rounded-lg p-6 space-y-6",
            isMobile && "border-0 rounded-none",
            className
        )}>
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <SlidersHorizontal className="h-5 w-5 text-primary" />
                    <h3 className="font-semibold text-lg">Filters</h3>
                </div>
                {isMobile && onClose && (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={onClose}
                        className="h-8 w-8 p-0"
                    >
                        <X className="h-4 w-4" />
                    </Button>
                )}
            </div>

            <Separator />

            {/* Category Filter */}
            <div className="space-y-3">
                <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                    Category
                </h4>
                <div className="flex flex-wrap gap-2">
                    {categories.map((category) => (
                        <CategoryBadge
                            key={category}
                            category={category}
                            isActive={selectedCategory === category}
                            onClick={() =>
                                onCategoryChange(selectedCategory === category ? undefined : category)
                            }
                        />
                    ))}
                </div>
            </div>

            <Separator />

            {/* Sort Options */}
            <div className="space-y-3">
                <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                    Sort By
                </h4>
                <div className="space-y-2">
                    {sortOptions.map((option) => (
                        <button
                            key={option.value}
                            onClick={() => onSortChange(option.value)}
                            className={cn(
                                "w-full text-left px-3 py-2.5 rounded-md transition-all duration-200",
                                "border border-transparent",
                                sortBy === option.value
                                    ? "bg-primary text-primary-foreground border-primary font-medium"
                                    : "hover:bg-accent hover:border-border"
                            )}
                        >
                            {option.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Clear Filters */}
            {hasActiveFilters && (
                <>
                    <Separator />
                    <Button
                        variant="outline"
                        onClick={onClearFilters}
                        className="w-full border-border hover:bg-destructive hover:text-destructive-foreground hover:border-destructive transition-all"
                    >
                        <X className="h-4 w-4 mr-2" />
                        Clear All Filters
                    </Button>
                </>
            )}
        </div>
    );
}
