import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { Dumbbell, Target, Users, Award } from "lucide-react";

export const metadata = {
  title: "About Us | IRONFORGE GYM",
  description: "Learn about IRONFORGE GYM - our mission, values, and commitment to helping you achieve your fitness goals.",
};

const values = [
  {
    icon: Target,
    title: "Mission-Driven",
    description: "We're committed to helping every member achieve their fitness goals, no matter where they start.",
  },
  {
    icon: Users,
    title: "Community First",
    description: "We foster a supportive environment where members motivate and inspire each other.",
  },
  {
    icon: Award,
    title: "Excellence",
    description: "From equipment to trainers, we maintain the highest standards in everything we do.",
  },
  {
    icon: Dumbbell,
    title: "Innovation",
    description: "We continuously evolve our offerings to provide the best fitness experience possible.",
  },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        <section className="container mx-auto px-4 py-12">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <h1 className="font-[family-name:var(--font-bebas)] text-4xl md:text-5xl tracking-wide mb-6">
              ABOUT <span className="text-primary">IRONFORGE</span>
            </h1>
            <p className="text-xl text-muted-foreground">
              Founded with a passion for fitness and a commitment to excellence, IRONFORGE GYM has been
              transforming lives since 2020. We believe everyone deserves access to world-class fitness
              facilities and expert guidance.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
            {values.map((value) => (
              <div key={value.title} className="p-6 rounded-xl bg-card border border-border">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <value.icon className="h-6 w-6 text-primary" />
                </div>
                <h2 className="text-xl font-semibold mb-2">{value.title}</h2>
                <p className="text-muted-foreground">{value.description}</p>
              </div>
            ))}
          </div>

          <div className="max-w-3xl mx-auto">
            <h2 className="font-[family-name:var(--font-bebas)] text-3xl tracking-wide mb-6 text-center">
              OUR <span className="text-primary">STORY</span>
            </h2>
            <div className="space-y-4 text-muted-foreground">
              <p>
                IRONFORGE GYM was born from a simple idea: fitness should be accessible, enjoyable, and effective
                for everyone. Our founders, passionate fitness enthusiasts themselves, saw a gap in the market for
                a gym that truly put members first.
              </p>
              <p>
                Today, we serve over 10,000 active members with state-of-the-art equipment, 50+ expert trainers,
                and facilities that are open 24/7. Our innovative booking system makes it easy to schedule sessions,
                track progress, and stay motivated on your fitness journey.
              </p>
              <p>
                Whether you're a seasoned athlete or just starting your fitness journey, IRONFORGE is here to
                support you every step of the way. Join us and discover what you're capable of.
              </p>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
