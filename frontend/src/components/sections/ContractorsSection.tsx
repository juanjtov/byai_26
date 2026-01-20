import { motion } from 'framer-motion';
import { Container, SectionHeader } from '@/components/common';
import { fadeInUp, staggerContainer, viewportConfig } from '@/lib/animations';

const benefits = [
  {
    title: 'Your Pricing, Your Brand',
    description:
      'Upload your rate card once. Every estimate reflects your materials, labor rates, and markup—not some generic average.',
  },
  {
    title: 'Eliminate Quote Shopping',
    description:
      'When homeowners see professional, instant pricing, they stop calling your competitors. Close while the momentum is hot.',
  },
  {
    title: 'Standardized Scope',
    description:
      'Clear line items mean fewer "I thought that was included" conversations. Protect your margins from day one.',
  },
];

const contractLineItems = [
  { description: 'Semi-custom cabinetry (linear ft)', qty: '24', amount: '$9,600' },
  { description: 'Quartz countertops (sq ft)', qty: '42', amount: '$5,460' },
  { description: 'Premium fixture package', qty: '1', amount: '$2,400' },
  { description: 'Multi-zone lighting', qty: '1', amount: '$1,800' },
  { description: 'Labor & installation', qty: '1', amount: '$5,240' },
];

export function ContractorsSection() {
  return (
    <section id="contractors" className="bg-charcoal-light py-32">
      <Container>
        <div className="grid items-center gap-16 lg:grid-cols-2">
          {/* Contract preview */}
          <motion.div
            variants={fadeInUp}
            initial="hidden"
            whileInView="visible"
            viewport={viewportConfig}
            className="order-2 lg:order-1"
          >
            <motion.div
              className="relative"
              whileHover={{ rotate: 0 }}
              initial={{ rotate: 1 }}
              transition={{ duration: 0.3 }}
            >
              {/* Stacked cards effect */}
              <div className="absolute inset-0 translate-x-2 translate-y-2 rotate-2 rounded-xl bg-ivory/5" />
              <div className="absolute inset-0 translate-x-1 translate-y-1 rotate-1 rounded-xl bg-ivory/10" />

              {/* Main contract */}
              <div className="relative rounded-xl bg-ivory p-8 text-charcoal shadow-2xl">
                {/* Header */}
                <div className="mb-6 flex items-center gap-4 border-b border-charcoal/10 pb-6">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-charcoal text-lg font-bold text-ivory">
                    AB
                  </div>
                  <div>
                    <div className="font-medium">Alpha Builders</div>
                    <div className="text-sm text-charcoal/50">Licensed & Insured</div>
                  </div>
                </div>

                {/* Project info */}
                <div className="mb-6">
                  <div className="text-sm text-charcoal/50">Project</div>
                  <div className="font-display text-xl">Kitchen Remodel — Signature Package</div>
                </div>

                {/* Line items */}
                <div className="mb-6 space-y-3">
                  {contractLineItems.map((item) => (
                    <div key={item.description} className="flex items-center justify-between text-sm">
                      <span className="text-charcoal/70">{item.description}</span>
                      <span className="font-medium">{item.amount}</span>
                    </div>
                  ))}
                </div>

                {/* Total */}
                <div className="flex items-center justify-between border-t border-charcoal/10 pt-4">
                  <span className="font-medium">Total</span>
                  <span className="font-display text-2xl">$24,500</span>
                </div>

                {/* Timeline */}
                <div className="mt-4 rounded-lg bg-charcoal/5 p-3 text-center text-sm">
                  <span className="text-charcoal/50">Estimated Timeline:</span>{' '}
                  <span className="font-medium">3-4 weeks</span>
                </div>

                {/* Signature lines */}
                <div className="mt-8 grid grid-cols-2 gap-8">
                  <div>
                    <div className="h-px bg-charcoal/20" />
                    <div className="mt-2 text-xs text-charcoal/40">Homeowner Signature</div>
                  </div>
                  <div>
                    <div className="h-px bg-charcoal/20" />
                    <div className="mt-2 text-xs text-charcoal/40">Date</div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>

          {/* Content */}
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={viewportConfig}
            className="order-1 lg:order-2"
          >
            <SectionHeader
              eyebrow="For Contractors"
              headline="Close more jobs. In less time."
            />

            <div className="space-y-8">
              {benefits.map((benefit, index) => (
                <motion.div
                  key={benefit.title}
                  variants={fadeInUp}
                  className="group"
                >
                  <div className="flex gap-4">
                    <span className="font-display text-2xl text-amber/30 transition-colors group-hover:text-amber">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    <div>
                      <h3 className="text-lg font-medium text-ivory">{benefit.title}</h3>
                      <p className="mt-2 text-ivory/50">{benefit.description}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </Container>
    </section>
  );
}
