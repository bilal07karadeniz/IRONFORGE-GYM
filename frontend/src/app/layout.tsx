"use client";

import { Outfit, Bebas_Neue } from "next/font/google";
import { Toaster } from "sonner";
import { AuthProvider } from "@/contexts/auth-context";
import "./globals.css";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const bebasNeue = Bebas_Neue({
  variable: "--font-bebas",
  subsets: ["latin"],
  weight: "400",
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <title>IRONFORGE GYM - Push Your Limits</title>
        <meta name="description" content="Book your gym sessions, personal training, and fitness classes at IRONFORGE GYM. Track your progress, connect with certified trainers, and achieve your fitness goals with our 24/7 facility." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="canonical" href="https://ironforge-gym.netlify.app" />

        {/* Open Graph */}
        <meta property="og:type" content="website" />
        <meta property="og:title" content="IRONFORGE GYM - Push Your Limits" />
        <meta property="og:description" content="Book your gym sessions, personal training, and fitness classes at IRONFORGE GYM. Track your progress and achieve your fitness goals." />
        <meta property="og:url" content="https://ironforge-gym.netlify.app" />
        <meta property="og:site_name" content="IRONFORGE GYM" />

        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="IRONFORGE GYM - Push Your Limits" />
        <meta name="twitter:description" content="Book your gym sessions, personal training, and fitness classes at IRONFORGE GYM." />

        {/* Additional SEO */}
        <meta name="robots" content="index, follow" />
        <meta name="theme-color" content="#f97316" />
      </head>
      <body
        className={`${outfit.variable} ${bebasNeue.variable} font-sans antialiased min-h-screen`}
      >
        <AuthProvider>
          {/* Skip Navigation Link for Accessibility */}
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md focus:outline-none"
          >
            Skip to main content
          </a>
          <div className="relative min-h-screen">
            {/* Background Effects */}
            <div className="fixed inset-0 grid-pattern opacity-30 pointer-events-none" />
            <div className="fixed top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
            <div className="fixed bottom-0 right-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl pointer-events-none" />

            {/* Main Content */}
            <div id="main-content" className="relative z-10">
              {children}
            </div>
          </div>
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                background: 'oklch(0.14 0.005 285)',
                border: '1px solid oklch(0.25 0.01 285)',
                color: 'oklch(0.98 0 0)',
              },
              className: 'font-sans',
            }}
            richColors
            closeButton
          />
        </AuthProvider>
      </body>
    </html>
  );
}
