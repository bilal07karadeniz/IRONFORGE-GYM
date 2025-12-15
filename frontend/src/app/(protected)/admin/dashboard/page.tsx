"use client";

import { useState, useEffect } from "react";
import { adminApi } from "@/lib/api";
import { AdminStats } from "@/types";
import { StatsCard } from "@/components/dashboard/stats-card";
import { AnalyticsChart } from "@/components/admin/analytics-chart";
import { Skeleton } from "@/components/ui/skeleton";
import { DollarSign, Users, Calendar, Trophy } from "lucide-react";

export default function AdminDashboardPage() {
    const [stats, setStats] = useState<AdminStats | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            setIsLoading(true);
            const response = await adminApi.getStats();
            setStats(response.data.data);
        } catch (error) {
            console.error("Failed to fetch admin stats:", error);
            // Use mock data for demo
            setStats(getMockAdminStats());
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold mb-8 gradient-text">Admin Dashboard</h1>

            {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    {[...Array(4)].map((_, i) => (
                        <Skeleton key={i} className="h-32" />
                    ))}
                </div>
            ) : stats ? (
                <div className="space-y-8">
                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <StatsCard
                            title="Total Revenue"
                            value={`$${stats.revenue.total.toLocaleString()}`}
                            icon={DollarSign}
                            trend={{ value: stats.revenue.change, isPositive: stats.revenue.change >= 0 }}
                            variant="success"
                        />
                        <StatsCard
                            title="Total Bookings"
                            value={stats.bookings.total}
                            icon={Calendar}
                            trend={{ value: stats.bookings.change, isPositive: stats.bookings.change >= 0 }}
                            variant="primary"
                        />
                        <StatsCard
                            title="Active Users"
                            value={stats.activeUsers.total}
                            icon={Users}
                            trend={{ value: stats.activeUsers.change, isPositive: stats.activeUsers.change >= 0 }}
                            variant="default"
                        />
                        <StatsCard
                            title="Top Class"
                            value={stats.popularClasses[0]?.name || "N/A"}
                            icon={Trophy}
                            variant="warning"
                        />
                    </div>

                    {/* Charts */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <AnalyticsChart
                            title="Revenue Overview"
                            data={stats.revenue.history}
                            color="#22c55e"
                            type="bar" // Using Bar chart for revenue
                        />
                        <AnalyticsChart
                            title="Booking Trends"
                            data={stats.bookings.history}
                            color="#84cc16"
                            type="line" // Using Line chart for bookings
                        />
                    </div>
                </div>
            ) : null}
        </div>
    );
}

function getMockAdminStats(): AdminStats {
    const dates = Array.from({ length: 7 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (6 - i));
        return d.toISOString().split('T')[0];
    });

    return {
        revenue: {
            total: 15420,
            change: 12.5,
            history: dates.map(date => ({ date, value: Math.floor(Math.random() * 1000) + 500 }))
        },
        bookings: {
            total: 342,
            change: 8.2,
            history: dates.map(date => ({ date, value: Math.floor(Math.random() * 50) + 10 }))
        },
        activeUsers: {
            total: 89,
            change: 5.4,
            history: dates.map(date => ({ date, value: Math.floor(Math.random() * 20) + 70 }))
        },
        popularClasses: [
            { name: "HIIT Morning", bookings: 45, revenue: 900 },
            { name: "Yoga Flow", bookings: 38, revenue: 760 },
            { name: "Power Lifting", bookings: 32, revenue: 640 }
        ]
    };
}
