import { forwardRef } from 'react';

interface TierCardProps {
  name: string;
  price: string;
  isActive?: boolean;
  className?: string;
}

function TierCard({ name, price, isActive, className = '' }: TierCardProps) {
  return (
    <div
      className={`tier-card px-3 py-2 rounded-lg transition-all ${className}`}
      style={{
        background: isActive ? 'rgba(200, 141, 116, 0.15)' : 'rgba(44, 44, 46, 0.8)',
        border: isActive ? '1px solid rgba(200, 141, 116, 0.5)' : '1px solid rgba(44, 44, 46, 0.5)',
        boxShadow: isActive ? '0 0 20px rgba(200, 141, 116, 0.2)' : 'none',
        opacity: 0,
        transform: 'translateY(10px)',
      }}
    >
      <div className="text-[8px] uppercase tracking-wider text-body mb-0.5">{name}</div>
      <div className="font-display text-sm text-ivory font-light">{price}</div>
    </div>
  );
}

export const EstimateStage = forwardRef<HTMLDivElement>((_, ref) => {
  return (
    <div
      ref={ref}
      className="absolute inset-0 flex flex-col items-center justify-center estimate-stage"
      style={{ opacity: 0 }}
    >
      {/* Main price display */}
      <div className="price-container text-center mb-4">
        <div className="text-[10px] uppercase tracking-widest text-body mb-1">
          Estimated Total
        </div>
        <div
          className="price-value font-display text-4xl font-light text-ivory"
          style={{
            textShadow: '0 0 30px rgba(200, 141, 116, 0.3)',
          }}
        >
          $0
        </div>
      </div>

      {/* Tier cards */}
      <div className="tier-cards flex gap-2 mb-3">
        <TierCard name="Economy" price="$38,200" className="tier-economy" />
        <TierCard name="Standard" price="$42,500" isActive className="tier-standard" />
        <TierCard name="Premium" price="$51,800" className="tier-premium" />
      </div>

      {/* Confidence badge */}
      <div
        className="confidence-badge flex items-center gap-1.5 px-2 py-1 rounded-full"
        style={{
          background: 'rgba(207, 255, 4, 0.1)',
          border: '1px solid rgba(207, 255, 4, 0.3)',
          opacity: 0,
          transform: 'scale(0.9)',
        }}
      >
        <div className="w-1.5 h-1.5 rounded-full bg-signal" />
        <span className="text-[9px] font-body uppercase tracking-wider text-signal">
          94% Confidence
        </span>
      </div>

      {/* Material chips */}
      <div className="material-chips flex gap-1.5 mt-3" style={{ opacity: 0 }}>
        {['Oak', 'Quartz', 'Brass'].map((material) => (
          <span
            key={material}
            className="px-2 py-0.5 rounded text-[8px] font-body uppercase tracking-wider text-body"
            style={{
              background: 'rgba(44, 44, 46, 0.6)',
              border: '1px solid rgba(118, 138, 134, 0.3)',
            }}
          >
            {material}
          </span>
        ))}
      </div>
    </div>
  );
});

EstimateStage.displayName = 'EstimateStage';
