import { useState } from 'react';
import { motion } from 'framer-motion';
import { Container, Button } from '@/components/common';
import { fadeInUp, viewportConfig } from '@/lib/animations';

export function CTASection() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setSubmitted(true);
      // In production, this would submit to an API
    }
  };

  return (
    <section className="relative overflow-hidden bg-charcoal py-32">
      {/* Radial gradient background */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse at center, rgba(201, 165, 77, 0.15) 0%, transparent 70%)',
        }}
      />

      <Container className="relative z-10">
        <motion.div
          variants={fadeInUp}
          initial="hidden"
          whileInView="visible"
          viewport={viewportConfig}
          className="mx-auto max-w-2xl text-center"
        >
          <h2 className="font-display text-4xl font-light text-ivory md:text-5xl lg:text-6xl">
            Ready to close in ten minutes?
          </h2>
          <p className="mt-6 text-lg text-ivory/60">
            Join the private beta and be among the first contractors to transform how you sell renovations.
          </p>

          {/* Form */}
          {!submitted ? (
            <form onSubmit={handleSubmit} className="mt-10">
              <div className="flex flex-col gap-4 sm:flex-row">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  required
                  className="flex-1 rounded-none border border-ivory/10 bg-charcoal-light px-6 py-4 text-ivory placeholder-ivory/30 transition-colors focus:border-amber focus:outline-none"
                />
                <Button type="submit" variant="primary" size="lg">
                  Request Access
                </Button>
              </div>
              <p className="mt-4 text-sm text-ivory/30">
                Limited spots available. We'll reach out within 48 hours.
              </p>
            </form>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mt-10 rounded-xl border border-sage/30 bg-sage/10 p-8"
            >
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-sage/20 text-sage">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="font-display text-2xl text-ivory">You're on the list!</h3>
              <p className="mt-2 text-ivory/60">
                We'll be in touch soon with your early access details.
              </p>
            </motion.div>
          )}
        </motion.div>
      </Container>
    </section>
  );
}
