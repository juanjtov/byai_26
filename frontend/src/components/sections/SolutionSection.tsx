import { motion } from 'framer-motion';
import { Container, SectionHeader } from '@/components/common';
import { fadeInUp, staggerContainer, viewportConfig } from '@/lib/animations';

const steps = [
  {
    number: '01',
    title: 'Scan the Space',
    description:
      'Walk the room with your phone or tablet. Our AI captures every dimension in under 2 minutes.',
    icon: (
      <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5v-4m0 4h-4m4 0l-5-5"
        />
      </svg>
    ),
  },
  {
    number: '02',
    title: 'Explore Options',
    description:
      'Instantly generate three pricing tiers from your rate card. Adjust scope with a single slider.',
    icon: (
      <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
        />
      </svg>
    ),
  },
  {
    number: '03',
    title: 'Sign & Close',
    description:
      'Lock in the scope, generate the contract, and capture the signature—all before you pack up.',
    icon: (
      <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
        />
      </svg>
    ),
  },
];

export function SolutionSection() {
  return (
    <section id="solution" className="bg-charcoal py-32">
      <Container>
        <SectionHeader
          eyebrow="The Solution"
          headline="One flow. Zero friction."
          align="center"
        />

        {/* Timeline comparison badge */}
        <motion.div
          variants={fadeInUp}
          initial="hidden"
          whileInView="visible"
          viewport={viewportConfig}
          className="mx-auto mb-20 flex justify-center"
        >
          <div className="inline-flex items-center gap-4 rounded-full border border-amber/20 bg-amber/5 px-6 py-3">
            <span className="text-sm text-ivory/60 line-through">28+ days</span>
            <svg className="h-4 w-4 text-amber" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
            <span className="font-medium text-amber">10 minutes</span>
          </div>
        </motion.div>

        {/* Step cards */}
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={viewportConfig}
          className="grid gap-8 md:grid-cols-3"
        >
          {steps.map((step) => (
            <motion.div
              key={step.number}
              variants={fadeInUp}
              className="group relative"
            >
              <div className="relative overflow-hidden rounded-2xl border border-ivory/5 bg-charcoal-light p-8 transition-all duration-300 hover:border-amber/30">
                {/* Gradient border on hover */}
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber to-transparent opacity-0 transition-opacity group-hover:opacity-100" />

                {/* Large faded number */}
                <span className="absolute right-4 top-4 font-display text-8xl font-light text-ivory/[0.03] transition-all group-hover:text-amber/10">
                  {step.number}
                </span>

                {/* Icon */}
                <div className="relative mb-6 inline-flex rounded-xl border border-ivory/10 bg-charcoal p-4 text-amber">
                  {step.icon}
                </div>

                {/* Content */}
                <h3 className="relative mb-3 font-display text-2xl font-light text-ivory">
                  {step.title}
                </h3>
                <p className="relative text-ivory/50">{step.description}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </Container>
    </section>
  );
}
