import { type ReactNode } from 'react';

interface HeroDemoMockupProps {
  children: ReactNode;
}

export function HeroDemoMockup({ children }: HeroDemoMockupProps) {
  return (
    <div className="relative animate-gentle-float">
      {/* Glow effect behind the mockup */}
      <div
        className="absolute -inset-4 rounded-[32px] opacity-40 blur-2xl"
        style={{
          background: 'radial-gradient(ellipse at center, rgba(200,141,116,0.3) 0%, transparent 70%)'
        }}
      />

      {/* Tablet mockup frame */}
      <div
        className="relative w-[420px] h-[300px] rounded-3xl overflow-hidden"
        style={{
          background: 'var(--color-obsidian)',
          border: '6px solid var(--color-surface-light)',
          boxShadow: `
            0 0 0 1px rgba(200, 141, 116, 0.1),
            0 25px 50px -12px rgba(0, 0, 0, 0.5),
            0 0 80px rgba(200, 141, 116, 0.08),
            inset 0 1px 0 rgba(255, 255, 255, 0.05)
          `,
          transform: 'perspective(1000px) rotateY(-5deg) rotateX(2deg)',
        }}
      >
        {/* Screen bezel effect */}
        <div className="absolute inset-0 rounded-[18px] overflow-hidden bg-tungsten">
          {/* Inner screen */}
          <div className="absolute inset-2 rounded-xl overflow-hidden bg-obsidian">
            {/* Subtle screen reflection */}
            <div
              className="absolute inset-0 pointer-events-none z-50"
              style={{
                background: 'linear-gradient(135deg, rgba(255,255,255,0.03) 0%, transparent 50%)'
              }}
            />
            {/* Content */}
            {children}
          </div>
        </div>

        {/* Camera notch */}
        <div className="absolute top-3 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-surface-light opacity-50" />
      </div>
    </div>
  );
}
