"use client";

import Link from "next/link";
import { Dumbbell } from "lucide-react";

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle: string;
}

export function AuthLayout({ children, title, subtitle }: AuthLayoutProps) {
  return (
    <div className="min-h-screen flex">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        {/* Background with gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-background via-card to-background" />

        {/* Grid pattern */}
        <div className="absolute inset-0 grid-pattern opacity-50" />

        {/* Decorative elements */}
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <Dumbbell className="h-10 w-10 text-primary transition-transform group-hover:rotate-12" />
            <span className="font-[family-name:var(--font-bebas)] text-3xl tracking-wider">
              IRON<span className="text-primary">FORGE</span>
            </span>
          </Link>

          {/* Main Content */}
          <div className="space-y-6">
            <h1 className="font-[family-name:var(--font-bebas)] text-6xl xl:text-7xl tracking-wide leading-tight">
              PUSH YOUR
              <br />
              <span className="gradient-text text-glow">LIMITS</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-md">
              Transform your body. Elevate your mind. Join thousands of members
              achieving their fitness goals every day.
            </p>

            {/* Stats */}
            <div className="flex gap-8 pt-6">
              <div>
                <div className="font-[family-name:var(--font-bebas)] text-4xl text-primary">
                  10K+
                </div>
                <div className="text-sm text-muted-foreground">Active Members</div>
              </div>
              <div>
                <div className="font-[family-name:var(--font-bebas)] text-4xl text-primary">
                  50+
                </div>
                <div className="text-sm text-muted-foreground">Expert Trainers</div>
              </div>
              <div>
                <div className="font-[family-name:var(--font-bebas)] text-4xl text-primary">
                  24/7
                </div>
                <div className="text-sm text-muted-foreground">Always Open</div>
              </div>
            </div>
          </div>

          {/* Bottom */}
          <div className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} IRONFORGE GYM. All rights reserved.
          </div>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="w-full lg:w-1/2 flex flex-col">
        {/* Mobile Logo */}
        <div className="lg:hidden p-6">
          <Link href="/" className="flex items-center gap-2">
            <Dumbbell className="h-8 w-8 text-primary" />
            <span className="font-[family-name:var(--font-bebas)] text-2xl tracking-wider">
              IRON<span className="text-primary">FORGE</span>
            </span>
          </Link>
        </div>

        {/* Form Container */}
        <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
          <div className="w-full max-w-md space-y-8 animate-slide-up">
            {/* Header */}
            <div className="text-center lg:text-left">
              <h2 className="font-[family-name:var(--font-bebas)] text-4xl tracking-wide">
                {title}
              </h2>
              <p className="mt-2 text-muted-foreground">{subtitle}</p>
            </div>

            {/* Form Content */}
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
