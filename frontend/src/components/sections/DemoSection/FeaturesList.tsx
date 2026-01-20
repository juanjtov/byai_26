import { motion, AnimatePresence } from 'framer-motion';

interface FeaturesListProps {
  features: string[];
}

export function FeaturesList({ features }: FeaturesListProps) {
  return (
    <div className="rounded-xl border border-ivory/5 bg-charcoal p-6">
      <h4 className="mb-4 text-sm font-medium uppercase tracking-wider text-ivory/40">
        Included Features
      </h4>
      <AnimatePresence mode="wait">
        <motion.ul
          key={features.join(',')}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="space-y-3"
        >
          {features.map((feature, index) => (
            <motion.li
              key={feature}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="flex items-center gap-3 text-ivory/70"
            >
              <svg
                className="h-5 w-5 flex-shrink-0 text-sage"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              {feature}
            </motion.li>
          ))}
        </motion.ul>
      </AnimatePresence>
    </div>
  );
}
