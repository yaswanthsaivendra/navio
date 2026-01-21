import {
  Navbar,
  HeroSection,
  SocialProof,
  HowItWorks,
  Benefits,
  CTASection,
  Footer,
} from "@/components/landing";

export default function Home() {
  return (
    <main className="bg-background min-h-screen">
      <Navbar />
      <HeroSection />
      <SocialProof />
      <HowItWorks />
      <Benefits />
      <CTASection />
      <Footer />
    </main>
  );
}
