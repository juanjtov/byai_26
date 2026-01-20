import { motion } from 'framer-motion';
import type { Package } from '@/types';
import { formatPrice } from '@/lib/pricing';

interface PackageCardProps {
  pkg: Package;
  isActive: boolean;
  onClick: () => void;
}

export function PackageCard({ pkg, isActive, onClick }: PackageCardProps) {
  const isSignature = pkg.name === 'Signature';

  return (
    <motion.button
      onClick={onClick}
      className={`relative w-full rounded-xl border p-6 text-left transition-all duration-300 ${
        isActive
          ? 'border-amber/50 bg-amber/5'
          : 'border-ivory/5 bg-charcoal hover:border-ivory/20'
      }`}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      {/* Active glow */}
      {isActive && (
        <div className="absolute inset-0 rounded-xl animate-pulse-glow" />
      )}

      {/* Recommended badge */}
      {isSignature && (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-amber px-3 py-1 text-xs font-medium uppercase tracking-wider text-charcoal">
          Popular
        </span>
      )}

      {/* Package name */}
      <div className="mb-4">
        <h4
          className={`font-display text-xl ${
            isActive ? 'text-amber' : 'text-ivory'
          }`}
        >
          {pkg.name}
        </h4>
      </div>

      {/* Price */}
      <div className="mb-4">
        <motion.span
          key={pkg.price}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`font-display text-3xl font-light ${
            isActive ? 'text-ivory' : 'text-ivory/60'
          }`}
        >
          {formatPrice(pkg.price)}
        </motion.span>
      </div>

      {/* Features preview */}
      <ul className="space-y-2">
        {pkg.features.slice(0, 3).map((feature) => (
          <li
            key={feature}
            className={`flex items-center gap-2 text-sm ${
              isActive ? 'text-ivory/70' : 'text-ivory/40'
            }`}
          >
            <svg
              className={`h-4 w-4 ${isActive ? 'text-amber' : 'text-ivory/30'}`}
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
          </li>
        ))}
        {pkg.features.length > 3 && (
          <li className={`text-sm ${isActive ? 'text-amber' : 'text-ivory/30'}`}>
            +{pkg.features.length - 3} more
          </li>
        )}
      </ul>
    </motion.button>
  );
}
