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
        <meta name="description" content="Book your gym sessions, track your progress, and achieve your fitness goals with IRONFORGE GYM." />
      </head>
      <body
        className={`${outfit.variable} ${bebasNeue.variable} font-sans antialiased min-h-screen`}
      >
        <AuthProvider>
          <div className="relative min-h-screen">
            {/* Background Effects */}
            <div className="fixed inset-0 grid-pattern opacity-30 pointer-events-none" />
            <div className="fixed top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
            <div className="fixed bottom-0 right-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl pointer-events-none" />

            {/* Main Content */}
            <div className="relative z-10">
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
