import { motion } from 'framer-motion';

type DemoPhase = 'scan' | 'measurements' | 'render' | 'estimate' | 'contract';

interface StageIndicatorProps {
  currentPhase: DemoPhase;
  progress: number;
}

const PHASES: { id: DemoPhase; label: string }[] = [
  { id: 'scan', label: 'Scan' },
  { id: 'measurements', label: 'Measure' },
  { id: 'render', label: 'Render' },
  { id: 'estimate', label: 'Estimate' },
  { id: 'contract', label: 'Contract' },
];

export function StageIndicator({ currentPhase, progress }: StageIndicatorProps) {
  const currentIndex = PHASES.findIndex(p => p.id === currentPhase);

  return (
    <div className="flex flex-col items-center gap-3 mt-6">
      {/* Stage dots */}
      <div className="flex items-center gap-2">
        {PHASES.map((phase, index) => {
          const isActive = phase.id === currentPhase;
          const isPast = index < currentIndex;

          return (
            <div key={phase.id} className="flex items-center">
              <motion.div
                className="relative"
                animate={{
                  scale: isActive ? 1 : 0.8,
                }}
                transition={{ duration: 0.3 }}
              >
                {/* Glow effect for active */}
                {isActive && (
                  <motion.div
                    className="absolute inset-0 rounded-full bg-copper"
                    initial={{ opacity: 0, scale: 1 }}
                    animate={{ opacity: [0.4, 0.2, 0.4], scale: [1, 1.5, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    style={{ filter: 'blur(4px)' }}
                  />
                )}

                {/* Dot */}
                <div
                  className={`relative w-2 h-2 rounded-full transition-all duration-300 ${
                    isActive
                      ? 'bg-copper'
                      : isPast
                      ? 'bg-copper/60'
                      : 'bg-ivory/20'
                  }`}
                  style={{
                    boxShadow: isActive ? '0 0 8px rgba(200, 141, 116, 0.6)' : 'none',
                  }}
                />
              </motion.div>

              {/* Connector line */}
              {index < PHASES.length - 1 && (
                <div
                  className={`w-4 h-px mx-1 transition-colors duration-300 ${
                    isPast ? 'bg-copper/40' : 'bg-ivory/10'
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Current stage label */}
      <motion.div
        key={currentPhase}
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -5 }}
        className="text-[9px] font-body uppercase tracking-[0.15em] text-body"
      >
        {PHASES[currentIndex]?.label}
      </motion.div>

      {/* Progress bar */}
      <div className="w-32 h-[2px] rounded-full bg-ivory/5 overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{
            width: `${progress}%`,
            background: 'linear-gradient(90deg, #C88D74 0%, #CFFF04 100%)',
            boxShadow: '0 0 8px rgba(207, 255, 4, 0.4)',
          }}
          transition={{ duration: 0.1 }}
        />
      </div>
    </div>
  );
}
