import { motion } from 'framer-motion';
import { Container, SectionHeader } from '@/components/common';
import { fadeInUp, staggerContainer, viewportConfig } from '@/lib/animations';

const painPoints = [
  {
    number: '01',
    title: 'Manual measurements waste hours',
    description:
      'Contractors spend 2-4 hours per job taking measurements by hand, only to return for "one more dimension."',
  },
  {
    number: '02',
    title: 'Spreadsheet pricing kills deals',
    description:
      'Going home to "work up the numbers" gives homeowners time to get competing bids—and cold feet.',
  },
  {
    number: '03',
    title: 'Change orders destroy margins',
    description:
      'Missed measurements and scope creep turn profitable jobs into money pits.',
  },
  {
    number: '04',
    title: 'No show-stopping moment',
    description:
      'Without instant, professional pricing, you\'re just another contractor in a lineup.',
  },
];

const processSteps = [
  { day: 'Day 1', status: 'complete', label: 'Initial consultation' },
  { day: 'Day 3', status: 'complete', label: 'Return for measurements' },
  { day: 'Day 7', status: 'pending', label: 'Send estimate' },
  { day: 'Day 14', status: 'pending', label: 'Follow-up calls' },
  { day: 'Day 28+', status: 'failed', label: 'Maybe close... maybe not' },
];

export function ProblemSection() {
  return (
    <section id="problem" className="bg-tungsten py-32">
      <Container>
        <SectionHeader
          eyebrow="The Problem"
          headline="Home renovation is still sold like it's 2005"
        />

        <div className="grid gap-16 lg:grid-cols-2">
          {/* Pain points */}
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={viewportConfig}
            className="space-y-8"
          >
            {painPoints.map((point) => (
              <motion.div
                key={point.number}
                variants={fadeInUp}
                className="group"
              >
                <div className="flex gap-6">
                  <span className="font-display text-3xl font-light text-copper/30 transition-all duration-300 group-hover:text-copper group-hover:text-glow-signal">
                    {point.number}
                  </span>
                  <div>
                    <h3 className="text-lg font-medium text-ivory">
                      {point.title}
                    </h3>
                    <p className="mt-2 text-ivory/50">{point.description}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* Traditional process card */}
          <motion.div
            variants={fadeInUp}
            initial="hidden"
            whileInView="visible"
            viewport={viewportConfig}
          >
            <div className="rounded-2xl border border-ivory/5 bg-obsidian p-8">
              <h4 className="mb-6 text-sm font-medium uppercase tracking-wider text-ivory/40">
                Traditional Process
              </h4>
              <div className="space-y-6">
                {processSteps.map((step, index) => (
                  <div key={step.day} className="flex items-center gap-4">
                    {/* Status indicator */}
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-full ${
                        step.status === 'complete'
                          ? 'bg-sage/20 text-sage'
                          : step.status === 'pending'
                          ? 'bg-ivory/5 text-ivory/30'
                          : 'bg-red-500/20 text-red-400'
                      }`}
                    >
                      {step.status === 'complete' ? (
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : step.status === 'pending' ? (
                        <span className="h-2 w-2 rounded-full bg-current" />
                      ) : (
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      )}
                    </div>
                    {/* Timeline line */}
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-ivory">{step.day}</span>
                        <span className="text-sm text-ivory/40">{step.label}</span>
                      </div>
                      {index < processSteps.length - 1 && (
                        <div className="ml-5 mt-3 h-6 w-px bg-ivory/10" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </Container>
    </section>
  );
}
