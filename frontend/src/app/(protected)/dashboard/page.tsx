"use client";

import { useAuth } from "@/contexts/auth-context";
import {
  Calendar,
  Dumbbell,
  Clock,
  TrendingUp,
  ChevronRight,
  Flame,
  Target,
  Award,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

const quickStats = [
  {
    label: "Sessions This Week",
    value: "4",
    change: "+2 from last week",
    icon: Calendar,
    trend: "up",
  },
  {
    label: "Current Streak",
    value: "12 days",
    change: "Personal best!",
    icon: Flame,
    trend: "up",
  },
  {
    label: "Hours Trained",
    value: "28h",
    change: "This month",
    icon: Clock,
    trend: "neutral",
  },
  {
    label: "Goals Completed",
    value: "3/5",
    change: "60% complete",
    icon: Target,
    trend: "up",
  },
];

const upcomingBookings = [
  {
    id: "1",
    title: "Strength Training",
    trainer: "Mike Johnson",
    time: "Today, 6:00 PM",
    duration: "60 min",
  },
  {
    id: "2",
    title: "HIIT Session",
    trainer: "Sarah Williams",
    time: "Tomorrow, 7:00 AM",
    duration: "45 min",
  },
  {
    id: "3",
    title: "Yoga Flow",
    trainer: "Emma Davis",
    time: "Wed, 5:30 PM",
    duration: "60 min",
  },
];

const achievements = [
  { name: "First Week Complete", icon: "🎯", unlocked: true },
  { name: "Early Bird", icon: "🌅", unlocked: true },
  { name: "Consistency King", icon: "👑", unlocked: true },
  { name: "Iron Will", icon: "💪", unlocked: false },
];

export default function DashboardPage() {
  const { user } = useAuth();

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8 animate-slide-up">
        <h1 className="font-[family-name:var(--font-bebas)] text-4xl md:text-5xl tracking-wide mb-2">
          WELCOME BACK,{" "}
          <span className="gradient-text">{user?.firstName?.toUpperCase()}</span>
        </h1>
        <p className="text-muted-foreground">
          Ready to crush your goals today? Here&apos;s your fitness overview.
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {quickStats.map((stat, index) => (
          <Card
            key={stat.label}
            className="bg-card border-border hover:border-primary/50 transition-all duration-300"
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">
                    {stat.label}
                  </p>
                  <p className="font-[family-name:var(--font-bebas)] text-3xl tracking-wide">
                    {stat.value}
                  </p>
                  <p
                    className={`text-xs mt-1 ${
                      stat.trend === "up"
                        ? "text-primary"
                        : "text-muted-foreground"
                    }`}
                  >
                    {stat.trend === "up" && (
                      <TrendingUp className="inline h-3 w-3 mr-1" />
                    )}
                    {stat.change}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <stat.icon className="h-6 w-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upcoming Bookings */}
        <div className="lg:col-span-2">
          <Card className="bg-card border-border">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="font-[family-name:var(--font-bebas)] text-2xl tracking-wide">
                UPCOMING SESSIONS
              </CardTitle>
              <Link href="/bookings">
                <Button variant="ghost" size="sm">
                  View All
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="space-y-4">
              {upcomingBookings.map((booking) => (
                <div
                  key={booking.id}
                  className="flex items-center gap-4 p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                >
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Dumbbell className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold truncate">{booking.title}</h4>
                    <p className="text-sm text-muted-foreground">
                      with {booking.trainer}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-medium">{booking.time}</p>
                    <p className="text-xs text-muted-foreground">
                      {booking.duration}
                    </p>
                  </div>
                </div>
              ))}

              {upcomingBookings.length === 0 && (
                <div className="text-center py-8">
                  <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground mb-4">
                    No upcoming sessions
                  </p>
                  <Link href="/schedule">
                    <Button className="glow-lime">Book a Session</Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Achievements */}
        <div>
          <Card className="bg-card border-border">
            <CardHeader className="pb-2">
              <CardTitle className="font-[family-name:var(--font-bebas)] text-2xl tracking-wide flex items-center gap-2">
                <Award className="h-5 w-5 text-primary" />
                ACHIEVEMENTS
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                {achievements.map((achievement) => (
                  <div
                    key={achievement.name}
                    className={`p-3 rounded-lg text-center transition-all ${
                      achievement.unlocked
                        ? "bg-primary/10 border border-primary/30"
                        : "bg-muted/30 opacity-50"
                    }`}
                  >
                    <span className="text-2xl block mb-1">
                      {achievement.icon}
                    </span>
                    <span className="text-xs font-medium">
                      {achievement.name}
                    </span>
                  </div>
                ))}
              </div>
              <Link href="/achievements" className="block mt-4">
                <Button variant="outline" className="w-full" size="sm">
                  View All Achievements
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="bg-card border-border mt-6">
            <CardHeader className="pb-2">
              <CardTitle className="font-[family-name:var(--font-bebas)] text-2xl tracking-wide">
                QUICK ACTIONS
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Link href="/schedule" className="block">
                <Button
                  variant="outline"
                  className="w-full justify-start h-12"
                >
                  <Calendar className="mr-3 h-5 w-5 text-primary" />
                  Book New Session
                </Button>
              </Link>
              <Link href="/trainers" className="block">
                <Button
                  variant="outline"
                  className="w-full justify-start h-12"
                >
                  <Dumbbell className="mr-3 h-5 w-5 text-primary" />
                  Browse Trainers
                </Button>
              </Link>
              <Link href="/profile" className="block">
                <Button
                  variant="outline"
                  className="w-full justify-start h-12"
                >
                  <Target className="mr-3 h-5 w-5 text-primary" />
                  Update Goals
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
