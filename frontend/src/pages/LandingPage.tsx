import { Navigation, Footer } from '@/components/layout';
import { NoiseOverlay } from '@/components/ui';
import {
  HeroSection,
  ProblemSection,
  SolutionSection,
  DemoSection,
  ConfidenceSection,
  ContractorsSection,
  CTASection,
} from '@/components/sections';

export function LandingPage() {
  return (
    <div className="min-h-screen bg-charcoal">
      <NoiseOverlay />
      <Navigation />
      <main>
        <HeroSection />
        <ProblemSection />
        <SolutionSection />
        <DemoSection />
        <ConfidenceSection />
        <ContractorsSection />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
}
