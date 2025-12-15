"use client";

import Link from "next/link";
import { Clock, Users, Award, ArrowRight, ChevronRight, Zap, Shield, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";

const features = [
  { icon: Calendar, title: "Easy Booking", description: "Book sessions in seconds with your preferred trainer." },
  { icon: Users, title: "Expert Trainers", description: "Train with certified professionals." },
  { icon: Clock, title: "24/7 Access", description: "Work out on your schedule." },
  { icon: Zap, title: "Modern Equipment", description: "State-of-the-art machines." },
  { icon: Shield, title: "Safe Environment", description: "Clean facilities with safety protocols." },
  { icon: Award, title: "Track Progress", description: "Monitor your journey with analytics." },
];

const testimonials = [
  { name: "Alex Thompson", role: "Member since 2023", content: "IRONFORGE transformed my fitness routine!", avatar: "AT" },
  { name: "Sarah Chen", role: "Member since 2022", content: "Best gym ever. 24/7 access is perfect.", avatar: "SC" },
  { name: "Marcus Johnson", role: "Member since 2024", content: "Achieved more in 3 months than years elsewhere.", avatar: "MJ" },
];

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent" />
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
          <div className="container mx-auto px-4 relative z-10">
            <div className="max-w-4xl mx-auto text-center space-y-8 animate-slide-up">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20">
                <Zap className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">New: AI-Powered Workout Plans</span>
              </div>
              <h1 className="font-[family-name:var(--font-bebas)] text-5xl sm:text-6xl md:text-7xl lg:text-8xl tracking-wide leading-none">
                FORGE YOUR<br /><span className="gradient-text text-glow">STRONGEST SELF</span>
              </h1>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Book sessions, track progress, and achieve your fitness goals with our state-of-the-art gym.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                <Link href="/register">
                  <Button size="lg" className="h-14 px-8 text-lg glow-lime group">
                    Start Free Trial<ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
                <Link href="/login">
                  <Button variant="outline" size="lg" className="h-14 px-8 text-lg">Sign In</Button>
                </Link>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-8 pt-8 border-t border-border mt-8">
                <div className="text-center"><div className="font-[family-name:var(--font-bebas)] text-4xl text-primary">10,000+</div><div className="text-sm text-muted-foreground">Active Members</div></div>
                <div className="text-center"><div className="font-[family-name:var(--font-bebas)] text-4xl text-primary">50+</div><div className="text-sm text-muted-foreground">Expert Trainers</div></div>
                <div className="text-center"><div className="font-[family-name:var(--font-bebas)] text-4xl text-primary">4.9</div><div className="text-sm text-muted-foreground">Member Rating</div></div>
                <div className="text-center"><div className="font-[family-name:var(--font-bebas)] text-4xl text-primary">24/7</div><div className="text-sm text-muted-foreground">Always Open</div></div>
              </div>
            </div>
          </div>
        </section>
        <section className="py-24 bg-card/50">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="font-[family-name:var(--font-bebas)] text-4xl md:text-5xl tracking-wide mb-4">WHY CHOOSE <span className="text-primary">IRONFORGE</span></h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">Everything you need to achieve your fitness goals.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {features.map((f) => (
                <div key={f.title} className="group p-6 rounded-xl bg-background border border-border hover:border-primary/50 transition-all">
                  <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-4"><f.icon className="h-7 w-7 text-primary" /></div>
                  <h3 className="font-semibold text-xl mb-2">{f.title}</h3>
                  <p className="text-muted-foreground">{f.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
        <section className="py-24">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="font-[family-name:var(--font-bebas)] text-4xl md:text-5xl tracking-wide mb-4">MEMBER <span className="text-primary">STORIES</span></h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {testimonials.map((t) => (
                <div key={t.name} className="p-6 rounded-xl bg-card border border-border">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center font-semibold text-primary">{t.avatar}</div>
                    <div><h4 className="font-semibold">{t.name}</h4><p className="text-sm text-muted-foreground">{t.role}</p></div>
                  </div>
                  <p className="text-muted-foreground italic">&quot;{t.content}&quot;</p>
                </div>
              ))}
            </div>
          </div>
        </section>
        <section className="py-24 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10" />
          <div className="container mx-auto px-4 relative z-10">
            <div className="max-w-3xl mx-auto text-center space-y-6">
              <h2 className="font-[family-name:var(--font-bebas)] text-4xl md:text-5xl lg:text-6xl tracking-wide">READY TO START YOUR<br /><span className="gradient-text">TRANSFORMATION?</span></h2>
              <p className="text-xl text-muted-foreground">Join thousands who have transformed their lives.</p>
              <div className="pt-4">
                <Link href="/register">
                  <Button size="lg" className="h-14 px-8 text-lg glow-lime group">Get Started Today<ChevronRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" /></Button>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
