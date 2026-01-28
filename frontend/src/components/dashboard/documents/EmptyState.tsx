import { motion } from 'framer-motion';
import { fadeInUp } from '@/lib/animations';

export function EmptyState() {
  return (
    <motion.div
      className="flex flex-col items-center justify-center py-16 px-4"
      variants={fadeInUp}
      initial="hidden"
      animate="visible"
    >
      {/* Line art illustration with copper accents */}
      <motion.div
        className="w-32 h-32 mb-6 relative"
        animate={{ y: [0, -8, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
      >
        <svg
          viewBox="0 0 120 120"
          fill="none"
          className="w-full h-full"
        >
          <defs>
            <linearGradient id="docGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#C88D74" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#768A86" stopOpacity="0.2" />
            </linearGradient>
            <linearGradient id="accentGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#C88D74" />
              <stop offset="100%" stopColor="#D4A08A" />
            </linearGradient>
          </defs>

          {/* Back document */}
          <g transform="translate(35, 10)">
            <rect
              x="0"
              y="0"
              width="50"
              height="65"
              rx="4"
              fill="url(#docGradient)"
              stroke="#C88D74"
              strokeWidth="1"
              strokeOpacity="0.3"
            />
            {/* Lines */}
            <line x1="8" y1="15" x2="42" y2="15" stroke="#B5ADA5" strokeWidth="1" strokeOpacity="0.3" />
            <line x1="8" y1="25" x2="35" y2="25" stroke="#B5ADA5" strokeWidth="1" strokeOpacity="0.3" />
            <line x1="8" y1="35" x2="38" y2="35" stroke="#B5ADA5" strokeWidth="1" strokeOpacity="0.3" />
          </g>

          {/* Middle document */}
          <g transform="translate(25, 25)">
            <rect
              x="0"
              y="0"
              width="50"
              height="65"
              rx="4"
              fill="url(#docGradient)"
              stroke="#C88D74"
              strokeWidth="1"
              strokeOpacity="0.5"
            />
            {/* Lines */}
            <line x1="8" y1="15" x2="42" y2="15" stroke="#B5ADA5" strokeWidth="1" strokeOpacity="0.4" />
            <line x1="8" y1="25" x2="32" y2="25" stroke="#B5ADA5" strokeWidth="1" strokeOpacity="0.4" />
            <line x1="8" y1="35" x2="40" y2="35" stroke="#B5ADA5" strokeWidth="1" strokeOpacity="0.4" />
            <line x1="8" y1="45" x2="28" y2="45" stroke="#B5ADA5" strokeWidth="1" strokeOpacity="0.4" />
          </g>

          {/* Front document */}
          <g transform="translate(15, 40)">
            <rect
              x="0"
              y="0"
              width="50"
              height="65"
              rx="4"
              fill="#1C1C1E"
              stroke="url(#accentGradient)"
              strokeWidth="1.5"
            />
            {/* Folded corner */}
            <path
              d="M40 0 L50 10 L40 10 Z"
              fill="#0F1012"
              stroke="url(#accentGradient)"
              strokeWidth="1"
            />
            {/* Lines */}
            <line x1="8" y1="20" x2="35" y2="20" stroke="#C88D74" strokeWidth="1.5" strokeOpacity="0.6" />
            <line x1="8" y1="30" x2="42" y2="30" stroke="#B5ADA5" strokeWidth="1" strokeOpacity="0.5" />
            <line x1="8" y1="40" x2="30" y2="40" stroke="#B5ADA5" strokeWidth="1" strokeOpacity="0.5" />
            <line x1="8" y1="50" x2="38" y2="50" stroke="#B5ADA5" strokeWidth="1" strokeOpacity="0.5" />
          </g>

          {/* Upload arrow accent */}
          <g transform="translate(80, 70)">
            <circle
              cx="15"
              cy="15"
              r="14"
              fill="#C88D74"
              fillOpacity="0.15"
              stroke="#C88D74"
              strokeWidth="1.5"
            />
            <path
              d="M15 22 L15 8 M10 13 L15 8 L20 13"
              stroke="#C88D74"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </g>
        </svg>
      </motion.div>

      <h3 className="font-display text-xl text-ivory mb-2">
        No documents uploaded yet
      </h3>
      <p className="text-body text-center max-w-xs">
        Upload contracts and cost sheets to train the estimation system
      </p>
    </motion.div>
  );
}
