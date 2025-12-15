import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";

export const metadata = {
  title: "Privacy Policy | IRONFORGE GYM",
  description: "Learn how IRONFORGE GYM collects, uses, and protects your personal information.",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-12">
        <div className="max-w-3xl mx-auto">
          <h1 className="font-[family-name:var(--font-bebas)] text-4xl md:text-5xl tracking-wide mb-8">
            PRIVACY <span className="text-primary">POLICY</span>
          </h1>

          <div className="prose prose-invert max-w-none space-y-6 text-muted-foreground">
            <p className="text-lg">Last updated: December 2024</p>

            <section className="space-y-4">
              <h2 className="text-xl font-semibold text-foreground">1. Information We Collect</h2>
              <p>We collect information you provide directly to us, such as when you create an account, book a session, or contact us for support. This includes:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Name and contact information (email, phone number)</li>
                <li>Account credentials</li>
                <li>Booking history and preferences</li>
                <li>Payment information (processed securely by our payment providers)</li>
              </ul>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-semibold text-foreground">2. How We Use Your Information</h2>
              <p>We use the information we collect to:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Provide and improve our services</li>
                <li>Process your bookings and payments</li>
                <li>Send you updates about your account and bookings</li>
                <li>Respond to your inquiries and support requests</li>
              </ul>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-semibold text-foreground">3. Data Security</h2>
              <p>We implement appropriate security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction.</p>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-semibold text-foreground">4. Your Rights</h2>
              <p>You have the right to access, update, or delete your personal information at any time through your account settings or by contacting us.</p>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-semibold text-foreground">5. Contact Us</h2>
              <p>If you have any questions about this Privacy Policy, please contact us at privacy@ironforge-gym.com</p>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
