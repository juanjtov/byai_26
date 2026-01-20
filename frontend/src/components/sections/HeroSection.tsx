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
    <section className="relative min-h-screen overflow-hidden bg-obsidian pt-20">
      {/* Background elements */}
      <GridBackground />
      <AnimatedOrb
        color="copper"
        size={500}
        className="right-[-10%] top-[10%]"
      />
      <AnimatedOrb
        color="sage"
        size={400}
        className="bottom-[10%] left-[-5%]"
      />

      {/* LiDAR Scanning Line - Subtle Copper */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-[5]">
        <div
          className="absolute left-0 right-0 h-[2px] animate-lidar-scan"
          style={{
            background: 'linear-gradient(90deg, transparent, #C88D74, transparent)',
            boxShadow: '0 0 20px 4px rgba(200,141,116,0.4)'
          }}
        />
      </div>

      <Container className="relative z-10 flex min-h-[calc(100vh-5rem)] flex-col justify-center py-20">
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="max-w-4xl"
        >
          {/* Eyebrow */}
          <motion.div variants={fadeInUp} className="mb-8 flex items-center gap-3">
            <span className="h-2 w-2 rounded-full bg-gold animate-gold-pulse" />
            <span className="text-sm uppercase tracking-widest text-body">
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
            className="mt-8 max-w-2xl text-lg leading-relaxed text-body md:text-xl"
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
              <div key={stat.label} className="group cursor-default">
                <div className="font-display text-3xl font-light text-copper md:text-4xl transition-all duration-300 group-hover:glow-sage">
                  {stat.value}
                </div>
                <div className="mt-2 text-xs uppercase tracking-wider text-body">
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
          className="h-14 w-8 rounded-full border border-gold/30 p-2"
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          <div className="h-2 w-1 mx-auto rounded-full bg-gold glow-gold" />
        </motion.div>
      </motion.div>
    </section>
  );
}
