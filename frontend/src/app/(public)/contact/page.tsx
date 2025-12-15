import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { Mail, Phone, MapPin, Clock } from "lucide-react";

export const metadata = {
  title: "Contact Us | IRONFORGE GYM",
  description: "Get in touch with IRONFORGE GYM. We're here to help with any questions about memberships, classes, or our facilities.",
};

const contactInfo = [
  {
    icon: Mail,
    title: "Email",
    value: "info@ironforge-gym.com",
    description: "We'll respond within 24 hours",
  },
  {
    icon: Phone,
    title: "Phone",
    value: "+1 (555) 123-4567",
    description: "Mon-Fri 8am-8pm",
  },
  {
    icon: MapPin,
    title: "Location",
    value: "123 Fitness Street",
    description: "Downtown, City 12345",
  },
  {
    icon: Clock,
    title: "Hours",
    value: "Open 24/7",
    description: "Staff available 6am-10pm",
  },
];

export default function ContactPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="font-[family-name:var(--font-bebas)] text-4xl md:text-5xl tracking-wide mb-4">
              CONTACT <span className="text-primary">US</span>
            </h1>
            <p className="text-xl text-muted-foreground">
              Have questions? We'd love to hear from you. Send us a message and we'll respond as soon as possible.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
            {contactInfo.map((item) => (
              <div key={item.title} className="p-6 rounded-xl bg-card border border-border flex items-start gap-4">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <item.icon className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h2 className="font-semibold mb-1">{item.title}</h2>
                  <p className="text-foreground">{item.value}</p>
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-card border border-border rounded-xl p-8">
            <h2 className="font-[family-name:var(--font-bebas)] text-2xl tracking-wide mb-6">
              FREQUENTLY ASKED <span className="text-primary">QUESTIONS</span>
            </h2>
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold mb-2">How do I book a session?</h3>
                <p className="text-muted-foreground">Log in to your account, navigate to the Schedule page, select your preferred class or trainer, and confirm your booking.</p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">What's the cancellation policy?</h3>
                <p className="text-muted-foreground">You can cancel bookings up to 24 hours before the scheduled time without any penalty.</p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Do you offer personal training?</h3>
                <p className="text-muted-foreground">Yes! We have 50+ certified personal trainers available. You can book one-on-one sessions through our app.</p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Is there a free trial?</h3>
                <p className="text-muted-foreground">New members can enjoy a 7-day free trial. Sign up to get started!</p>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
