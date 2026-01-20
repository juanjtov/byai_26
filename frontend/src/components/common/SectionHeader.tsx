import { motion } from 'framer-motion';
import { fadeInUp, viewportConfig } from '@/lib/animations';
import type { ReactNode } from 'react';

interface SectionHeaderProps {
  eyebrow: string;
  headline: ReactNode;
  description?: string;
  align?: 'left' | 'center';
}

export function SectionHeader({
  eyebrow,
  headline,
  description,
  align = 'left',
}: SectionHeaderProps) {
  const alignmentClasses = align === 'center' ? 'text-center' : 'text-left';

  return (
    <motion.div
      variants={fadeInUp}
      initial="hidden"
      whileInView="visible"
      viewport={viewportConfig}
      className={`mb-16 ${alignmentClasses}`}
    >
      <span className="mb-4 inline-block text-sm font-medium uppercase tracking-widest text-amber">
        {eyebrow}
      </span>
      <h2 className="font-display text-4xl font-light leading-tight text-ivory md:text-5xl lg:text-6xl">
        {headline}
      </h2>
      {description && (
        <p className="mt-6 max-w-2xl text-lg text-ivory/60">
          {description}
        </p>
      )}
    </motion.div>
  );
}
