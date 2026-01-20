import { motion } from 'framer-motion';
import { Button, Container, GradientText } from '@/components/common';
import { AnimatedOrb, GridBackground } from '@/components/ui';
import { fadeInUp, staggerContainer } from '@/lib/animations';

const stats = [
  { value: '10 min', label: 'Average time to contract' },
  { value: '3x', label: 'Higher close rate' },
  { value: '94%', label: 'Estimate accuracy' },
];

export function HeroSection() {
  return (
    <section className="relative min-h-screen overflow-hidden bg-charcoal pt-20">
      {/* Background elements */}
      <GridBackground />
      <AnimatedOrb
        color="amber"
        size={500}
        className="right-[-10%] top-[10%]"
      />
      <AnimatedOrb
        color="sage"
        size={400}
        className="bottom-[10%] left-[-5%]"
      />

      <Container className="relative z-10 flex min-h-[calc(100vh-5rem)] flex-col justify-center py-20">
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="max-w-4xl"
        >
          {/* Eyebrow */}
          <motion.div variants={fadeInUp} className="mb-8 flex items-center gap-3">
            <span className="h-2 w-2 rounded-full bg-amber animate-pulse-dot" />
            <span className="text-sm uppercase tracking-widest text-ivory/60">
              Now in Private Beta
            </span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            variants={fadeInUp}
            className="font-display text-5xl font-light leading-[1.1] md:text-7xl lg:text-8xl"
          >
            <span className="block text-ivory">From Scan</span>
            <span className="block">
              <GradientText>to Signed Contract</GradientText>
            </span>
            <span className="block text-ivory/40">in Ten Minutes</span>
          </motion.h1>

          {/* Subheadline */}
          <motion.p
            variants={fadeInUp}
            className="mt-8 max-w-2xl text-lg leading-relaxed text-ivory/60 md:text-xl"
          >
            The AI-powered estimator that turns your LiDAR scan into instant,
            accurate pricing—and a signed contract before you leave the room.
          </motion.p>

          {/* CTAs */}
          <motion.div
            variants={fadeInUp}
            className="mt-10 flex flex-col gap-4 sm:flex-row"
          >
            <Button variant="primary" size="lg">
              Request Early Access
            </Button>
            <Button variant="outline" size="lg">
              Watch the Demo
            </Button>
          </motion.div>

          {/* Stats */}
          <motion.div
            variants={fadeInUp}
            className="mt-20 grid grid-cols-3 gap-8 border-t border-ivory/10 pt-10"
          >
            {stats.map((stat) => (
              <div key={stat.label}>
                <div className="font-display text-3xl font-light text-amber md:text-4xl">
                  {stat.value}
                </div>
                <div className="mt-2 text-xs uppercase tracking-wider text-ivory/40">
                  {stat.label}
                </div>
              </div>
            ))}
          </motion.div>
        </motion.div>
      </Container>

      {/* Scroll indicator */}
      <motion.div
        className="absolute bottom-10 left-1/2 -translate-x-1/2"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.5, duration: 0.5 }}
      >
        <motion.div
          className="h-14 w-8 rounded-full border border-ivory/20 p-2"
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          <div className="h-2 w-1 mx-auto rounded-full bg-amber" />
        </motion.div>
      </motion.div>
    </section>
  );
}
