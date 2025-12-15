"use client";

import { useState, useEffect } from "react";
import { classesApi } from "@/lib/api";
import { GymClass, ClassCategory, ClassSortOption, ClassFilters } from "@/types";
import { SearchBar } from "@/components/ui/search-bar";
import { ClassCard } from "@/components/classes/class-card";
import { FilterSidebar } from "@/components/classes/filter-sidebar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { SlidersHorizontal, Dumbbell } from "lucide-react";

export default function ClassesPage() {
    const [classes, setClasses] = useState<GymClass[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filters, setFilters] = useState<ClassFilters>({
        search: "",
        sortBy: "name"
    });
    const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

    useEffect(() => {
        fetchClasses();
    }, [filters]);

    const fetchClasses = async () => {
        try {
            setIsLoading(true);
            const response = await classesApi.getAll({
                search: filters.search,
                category: filters.category,
                sortBy: filters.sortBy
            });
            setClasses(response.data.data || []);
        } catch (error) {
            console.error("Failed to fetch classes:", error);
            // For demo purposes, use mock data
            setClasses(getMockClasses());
        } finally {
            setIsLoading(false);
        }
    };

    const handleSearchChange = (search: string) => {
        setFilters(prev => ({ ...prev, search }));
    };

    const handleCategoryChange = (category?: ClassCategory) => {
        setFilters(prev => ({ ...prev, category }));
    };

    const handleSortChange = (sortBy: ClassSortOption) => {
        setFilters(prev => ({ ...prev, sortBy }));
    };

    const handleClearFilters = () => {
        setFilters({ search: "", sortBy: "name" });
    };

    const filteredClasses = filterAndSortClasses(classes, filters);

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <div className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
                <div className="container mx-auto px-4 py-6">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-primary/10 rounded-lg">
                            <Dumbbell className="h-6 w-6 text-primary" />
                        </div>
                        <h1 className="text-3xl font-bold gradient-text">Browse Classes</h1>
                    </div>
                    <p className="text-muted-foreground">
                        Discover and book from our wide variety of fitness classes
                    </p>
                </div>
            </div>

            <div className="container mx-auto px-4 py-8">
                <div className="flex flex-col lg:flex-row gap-6">
                    {/* Desktop Sidebar */}
                    <aside className="hidden lg:block w-80 shrink-0">
                        <div className="sticky top-24">
                            <FilterSidebar
                                selectedCategory={filters.category}
                                onCategoryChange={handleCategoryChange}
                                sortBy={filters.sortBy || "name"}
                                onSortChange={handleSortChange}
                                onClearFilters={handleClearFilters}
                            />
                        </div>
                    </aside>

                    {/* Main Content */}
                    <main className="flex-1 min-w-0">
                        {/* Mobile Filter + Search */}
                        <div className="flex gap-3 mb-6">
                            <div className="flex-1">
                                <SearchBar
                                    value={filters.search || ""}
                                    onChange={handleSearchChange}
                                    placeholder="Search classes..."
                                    isLoading={isLoading}
                                />
                            </div>

                            {/* Mobile Filter Button */}
                            <Sheet open={isMobileFilterOpen} onOpenChange={setIsMobileFilterOpen}>
                                <SheetTrigger asChild>
                                    <Button variant="outline" size="lg" className="lg:hidden">
                                        <SlidersHorizontal className="h-4 w-4" />
                                    </Button>
                                </SheetTrigger>
                                <SheetContent side="left" className="w-80 p-0">
                                    <FilterSidebar
                                        selectedCategory={filters.category}
                                        onCategoryChange={handleCategoryChange}
                                        sortBy={filters.sortBy || "name"}
                                        onSortChange={handleSortChange}
                                        onClearFilters={handleClearFilters}
                                        isMobile
                                        onClose={() => setIsMobileFilterOpen(false)}
                                    />
                                </SheetContent>
                            </Sheet>
                        </div>

                        {/* Desktop Search */}
                        <div className="hidden lg:block mb-6">
                            <SearchBar
                                value={filters.search || ""}
                                onChange={handleSearchChange}
                                placeholder="Search classes..."
                                isLoading={isLoading}
                            />
                        </div>

                        {/* Results Count */}
                        {!isLoading && (
                            <div className="mb-4 text-sm text-muted-foreground">
                                {filteredClasses.length} {filteredClasses.length === 1 ? 'class' : 'classes'} found
                            </div>
                        )}

                        {/* Classes Grid */}
                        {isLoading ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                                {[...Array(6)].map((_, i) => (
                                    <div key={i} className="space-y-4">
                                        <Skeleton className="h-48 w-full" />
                                        <Skeleton className="h-6 w-3/4" />
                                        <Skeleton className="h-4 w-full" />
                                        <Skeleton className="h-4 w-2/3" />
                                    </div>
                                ))}
                            </div>
                        ) : filteredClasses.length === 0 ? (
                            <div className="text-center py-20">
                                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-muted mb-4">
                                    <Dumbbell className="h-10 w-10 text-muted-foreground" />
                                </div>
                                <h3 className="text-xl font-semibold mb-2">No classes found</h3>
                                <p className="text-muted-foreground mb-6">
                                    Try adjusting your search or filters
                                </p>
                                <Button onClick={handleClearFilters} variant="outline">
                                    Clear Filters
                                </Button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 animate-fade-in">
                                {filteredClasses.map((gymClass) => (
                                    <ClassCard key={gymClass.id} gymClass={gymClass} />
                                ))}
                            </div>
                        )}
                    </main>
                </div>
            </div>
        </div>
    );
}

// Helper function to filter and sort classes
function filterAndSortClasses(classes: GymClass[], filters: ClassFilters): GymClass[] {
    let filtered = [...classes];

    // Apply search filter
    if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        filtered = filtered.filter(c =>
            c.name.toLowerCase().includes(searchLower) ||
            c.description.toLowerCase().includes(searchLower) ||
            c.trainer.name.toLowerCase().includes(searchLower)
        );
    }

    // Apply category filter
    if (filters.category) {
        filtered = filtered.filter(c => c.category === filters.category);
    }

    // Apply sorting
    switch (filters.sortBy) {
        case "name":
            filtered.sort((a, b) => a.name.localeCompare(b.name));
            break;
        case "popularity":
            filtered.sort((a, b) => b.popularity - a.popularity);
            break;
        case "duration":
            filtered.sort((a, b) => a.duration - b.duration);
            break;
    }

    return filtered;
}

// Mock data for demo
function getMockClasses(): GymClass[] {
    return [
        {
            id: "1",
            name: "Power Yoga Flow",
            description: "Dynamic yoga session combining strength and flexibility",
            category: "yoga",
            image: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800&q=80",
            trainer: {
                id: "t1",
                name: "Sarah Johnson",
                specialization: "Yoga Instructor",
                avatar: "https://i.pravatar.cc/150?img=1",
                rating: 4.9
            },
            duration: 60,
            capacity: 20,
            enrolled: 17,
            popularity: 95,
            schedule: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        },
        {
            id: "2",
            name: "HIIT Cardio Blast",
            description: "High-intensity interval training for maximum calorie burn",
            category: "cardio",
            image: "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800&q=80",
            trainer: {
                id: "t2",
                name: "Mike Chen",
                specialization: "Cardio Specialist",
                avatar: "https://i.pravatar.cc/150?img=12",
                rating: 4.8
            },
            duration: 45,
            capacity: 25,
            enrolled: 23,
            popularity: 92,
            schedule: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        },
        {
            id: "3",
            name: "Strength & Conditioning",
            description: "Build muscle and increase power with compound movements",
            category: "strength",
            image: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&q=80",
            trainer: {
                id: "t3",
                name: "David Torres",
                specialization: "Strength Coach",
                avatar: "https://i.pravatar.cc/150?img=13",
                rating: 4.7
            },
            duration: 75,
            capacity: 15,
            enrolled: 12,
            popularity: 88,
            schedule: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        },
        {
            id: "4",
            name: "Flexibility & Stretch",
            description: "Improve range of motion and prevent injuries",
            category: "flexibility",
            image: "https://images.unsplash.com/photo-1518611012118-696072aa579a?w=800&q=80",
            trainer: {
                id: "t4",
                name: "Emma Wilson",
                specialization: "Flexibility Coach",
                avatar: "https://i.pravatar.cc/150?img=5",
                rating: 4.9
            },
            duration: 50,
            capacity: 18,
            enrolled: 10,
            popularity: 75,
            schedule: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        },
        {
            id: "5",
            name: "Basketball Skills",
            description: "Improve your basketball fundamentals and team play",
            category: "sports",
            image: "https://images.unsplash.com/photo-1546519638-68e109498ffc?w=800&q=80",
            trainer: {
                id: "t5",
                name: "James Rodriguez",
                specialization: "Sports Coach",
                avatar: "https://i.pravatar.cc/150?img=14",
                rating: 4.6
            },
            duration: 90,
            capacity: 12,
            enrolled: 9,
            popularity: 82,
            schedule: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        },
        {
            id: "6",
            name: "Kickboxing Fundamentals",
            description: "Learn striking techniques and improve cardiovascular fitness",
            category: "martial-arts",
            image: "https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?w=800&q=80",
            trainer: {
                id: "t6",
                name: "Lisa Martinez",
                specialization: "Martial Arts Instructor",
                avatar: "https://i.pravatar.cc/150?img=9",
                rating: 4.8
            },
            duration: 60,
            capacity: 20,
            enrolled: 16,
            popularity: 90,
            schedule: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        },
        {
            id: "7",
            name: "Latin Dance Cardio",
            description: "Fun, high-energy dance workout with Latin rhythms",
            category: "dance",
            image: "https://images.unsplash.com/photo-1504609813442-a8924e83f76e?w=800&q=80",
            trainer: {
                id: "t7",
                name: "Sofia Garcia",
                specialization: "Dance Instructor",
                avatar: "https://i.pravatar.cc/150?img=10",
                rating: 4.9
            },
            duration: 55,
            capacity: 30,
            enrolled: 28,
            popularity: 96,
            schedule: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        },
        {
            id: "8",
            name: "Morning Yoga",
            description: "Gentle yoga to start your day with energy and focus",
            category: "yoga",
            image: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800&q=80",
            trainer: {
                id: "t1",
                name: "Sarah Johnson",
                specialization: "Yoga Instructor",
                avatar: "https://i.pravatar.cc/150?img=1",
                rating: 4.9
            },
            duration: 45,
            capacity: 25,
            enrolled: 20,
            popularity: 85,
            schedule: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        }
    ];
}
