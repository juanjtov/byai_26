import { motion } from 'framer-motion';
import { Container, SectionHeader } from '@/components/common';
import { CircularProgress } from '@/components/ui';
import { fadeInUp, staggerContainer, viewportConfig } from '@/lib/animations';

const checklistItems = [
  { label: 'All walls captured', completed: true },
  { label: 'Window dimensions confirmed', completed: true },
  { label: 'Electrical panel located', completed: true },
  { label: 'Plumbing access verified', completed: false, warning: 'May require additional access' },
  { label: 'Ceiling height confirmed', completed: true },
];

export function ConfidenceSection() {
  return (
    <section id="confidence" className="bg-charcoal py-32">
      <Container>
        <div className="grid items-center gap-16 lg:grid-cols-2">
          {/* Content */}
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={viewportConfig}
          >
            <SectionHeader
              eyebrow="Built-In Trust"
              headline="The Confidence Meter"
              description="Every estimate comes with a confidence score based on scan completeness. High scores mean fewer surprises. Lower scores highlight exactly what needs a second look—before the contract is signed."
            />

            {/* Checklist */}
            <motion.div variants={fadeInUp} className="space-y-4">
              {checklistItems.map((item, index) => (
                <motion.div
                  key={item.label}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className={`flex items-start gap-4 rounded-lg border p-4 ${
                    item.completed
                      ? 'border-sage/20 bg-sage/5'
                      : 'border-amber/30 bg-amber/5'
                  }`}
                >
                  {/* Icon */}
                  <div
                    className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full ${
                      item.completed ? 'bg-sage/20 text-sage' : 'bg-amber/20 text-amber'
                    }`}
                  >
                    {item.completed ? (
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                    )}
                  </div>
                  {/* Text */}
                  <div className="flex-1">
                    <span className={item.completed ? 'text-ivory' : 'text-amber'}>
                      {item.label}
                    </span>
                    {item.warning && (
                      <p className="mt-1 text-sm text-amber/70">{item.warning}</p>
                    )}
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>

          {/* Circular progress */}
          <motion.div
            variants={fadeInUp}
            initial="hidden"
            whileInView="visible"
            viewport={viewportConfig}
            className="flex justify-center lg:justify-end"
          >
            <CircularProgress value={87} size={280} strokeWidth={10} />
          </motion.div>
        </div>
      </Container>
    </section>
  );
}
