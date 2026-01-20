import { motion } from 'framer-motion';
import { Container, SectionHeader, Button } from '@/components/common';
import { fadeInUp, viewportConfig } from '@/lib/animations';
import { usePricing } from '@/hooks/usePricing';
import { formatPrice } from '@/lib/pricing';
import { PackageCard } from './PackageCard';
import { PriceSlider } from './PriceSlider';
import { FeaturesList } from './FeaturesList';

export function DemoSection() {
  const {
    sliderValue,
    setSliderValue,
    currentPackage,
    packages,
    currentPrice,
    selectPackage,
  } = usePricing();

  const activePackage = packages.find((p) => p.name === currentPackage);

  return (
    <section id="demo" className="bg-charcoal-light py-32">
      <Container>
        <SectionHeader
          eyebrow="The Experience"
          headline="Watch the price update in real time"
          description="No more spreadsheets. No more going home to 'run the numbers.' Show homeowners exactly what they're getting—and what it costs—while you're still in the room."
        />

        <motion.div
          variants={fadeInUp}
          initial="hidden"
          whileInView="visible"
          viewport={viewportConfig}
        >
          {/* Demo card */}
          <div className="overflow-hidden rounded-2xl border border-amber/20 bg-charcoal animate-pulse-glow">
            {/* Header */}
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-ivory/5 px-8 py-6">
              <div>
                <h3 className="font-display text-2xl text-ivory">Kitchen Remodel</h3>
                <p className="mt-1 text-sm text-ivory/40">12' × 14' • L-Shape</p>
              </div>
              <span className="rounded-full bg-sage/20 px-4 py-1.5 text-xs font-medium uppercase tracking-wider text-sage">
                Scanned
              </span>
            </div>

            {/* Main content */}
            <div className="p-8">
              {/* Current price display */}
              <div className="mb-8 text-center">
                <span className="text-sm uppercase tracking-wider text-ivory/40">
                  Estimated Total
                </span>
                <motion.div
                  key={currentPrice}
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="mt-2 font-display text-5xl font-light text-amber md:text-6xl"
                >
                  {formatPrice(currentPrice)}
                </motion.div>
                <span className="mt-2 inline-block text-sm text-ivory/40">
                  {currentPackage} Package
                </span>
              </div>

              {/* Slider */}
              <div className="mx-auto max-w-2xl">
                <PriceSlider value={sliderValue} onChange={setSliderValue} />
              </div>

              {/* Package cards */}
              <div className="mt-10 grid gap-4 md:grid-cols-3">
                {packages.map((pkg) => (
                  <PackageCard
                    key={pkg.name}
                    pkg={pkg}
                    isActive={pkg.name === currentPackage}
                    onClick={() => selectPackage(pkg.name)}
                  />
                ))}
              </div>

              {/* Features list */}
              {activePackage && (
                <div className="mt-8">
                  <FeaturesList features={activePackage.features} />
                </div>
              )}

              {/* CTA */}
              <div className="mt-10 text-center">
                <Button variant="primary" size="lg">
                  Lock Scope & Generate Contract
                </Button>
                <p className="mt-4 text-sm text-ivory/30">
                  Contract ready for signature in under 60 seconds
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </Container>
    </section>
  );
}
