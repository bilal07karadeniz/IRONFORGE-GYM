import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";

export const metadata = {
  title: "Terms of Service | IRONFORGE GYM",
  description: "Read the terms and conditions for using IRONFORGE GYM services.",
};

export default function TermsPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-12">
        <div className="max-w-3xl mx-auto">
          <h1 className="font-[family-name:var(--font-bebas)] text-4xl md:text-5xl tracking-wide mb-8">
            TERMS OF <span className="text-primary">SERVICE</span>
          </h1>

          <div className="prose prose-invert max-w-none space-y-6 text-muted-foreground">
            <p className="text-lg">Last updated: December 2024</p>

            <section className="space-y-4">
              <h2 className="text-xl font-semibold text-foreground">1. Acceptance of Terms</h2>
              <p>By accessing and using IRONFORGE GYM services, you agree to be bound by these Terms of Service and all applicable laws and regulations.</p>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-semibold text-foreground">2. Membership and Bookings</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li>Members must be at least 18 years old or have parental consent</li>
                <li>Bookings are subject to availability and may be cancelled with 24-hour notice</li>
                <li>No-shows may result in booking restrictions</li>
                <li>Members are responsible for maintaining accurate account information</li>
              </ul>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-semibold text-foreground">3. Facility Rules</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li>Proper gym attire and footwear required at all times</li>
                <li>Equipment must be wiped down after use</li>
                <li>Respect other members and staff</li>
                <li>No unauthorized photography or recording</li>
              </ul>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-semibold text-foreground">4. Liability</h2>
              <p>IRONFORGE GYM is not liable for any injuries sustained while using our facilities. Members exercise at their own risk and should consult a physician before beginning any fitness program.</p>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-semibold text-foreground">5. Modifications</h2>
              <p>We reserve the right to modify these terms at any time. Continued use of our services after changes constitutes acceptance of the new terms.</p>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-semibold text-foreground">6. Contact</h2>
              <p>For questions about these Terms, contact us at legal@ironforge-gym.com</p>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
