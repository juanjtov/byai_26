import { motion } from 'framer-motion';
import { Button, Container, GradientText } from '@/components/common';
import { AnimatedOrb, GridBackground } from '@/components/ui';
import { fadeInUp, staggerContainer, slideInRight } from '@/lib/animations';
import { HeroDemo } from './HeroDemo';

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

      <Container className="relative z-10 flex min-h-[calc(100vh-5rem)] items-center py-20">
        {/* Two-column grid layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 xl:gap-20 items-center w-full">
          {/* Left Column: Text Content */}
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="max-w-xl"
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
              className="font-display text-4xl font-light leading-[1.1] sm:text-5xl md:text-6xl xl:text-7xl"
            >
              <span className="block text-ivory whitespace-nowrap">From Scan</span>
              <span className="block whitespace-nowrap">
                <GradientText>to Signed Contract</GradientText>
              </span>
              <span className="block text-ivory/40 whitespace-nowrap">in Ten Minutes</span>
            </motion.h1>

            {/* Subheadline */}
            <motion.p
              variants={fadeInUp}
              className="mt-8 max-w-lg text-lg leading-relaxed text-body md:text-xl"
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
              className="mt-16 grid grid-cols-3 gap-6 border-t border-ivory/10 pt-8"
            >
              {stats.map((stat) => (
                <div key={stat.label} className="group cursor-default">
                  <div className="font-display text-2xl font-light text-copper md:text-3xl lg:text-4xl transition-all duration-300 group-hover:glow-sage">
                    {stat.value}
                  </div>
                  <div className="mt-2 text-[10px] md:text-xs uppercase tracking-wider text-body">
                    {stat.label}
                  </div>
                </div>
              ))}
            </motion.div>
          </motion.div>

          {/* Right Column: Demo Component */}
          <motion.div
            variants={slideInRight}
            initial="hidden"
            animate="visible"
            className="flex justify-center lg:justify-end mt-12 lg:mt-0 scale-75 lg:scale-100 origin-top"
          >
            <HeroDemo />
          </motion.div>
        </div>
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
