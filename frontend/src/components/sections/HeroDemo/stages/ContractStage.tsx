import { forwardRef } from 'react';

export const ContractStage = forwardRef<HTMLDivElement>((_, ref) => {
  return (
    <div
      ref={ref}
      className="absolute inset-0 flex flex-col items-center justify-center contract-stage"
      style={{ opacity: 0 }}
    >
      {/* Contract preview panel */}
      <div
        className="contract-panel w-[85%] max-w-[280px] rounded-xl p-4"
        style={{
          background: 'linear-gradient(180deg, rgba(28, 28, 30, 0.95) 0%, rgba(15, 16, 18, 0.95) 100%)',
          border: '1px solid rgba(200, 141, 116, 0.2)',
          boxShadow: '0 10px 40px rgba(0, 0, 0, 0.4)',
        }}
      >
        {/* Header */}
        <div className="contract-header text-center mb-3">
          <div className="text-[10px] uppercase tracking-[0.2em] text-copper mb-1">
            Service Agreement
          </div>
          <div className="h-px w-12 mx-auto bg-gradient-to-r from-transparent via-copper to-transparent" />
        </div>

        {/* Contract lines (simplified) */}
        <div className="contract-lines space-y-2 mb-4">
          <div className="contract-line h-[3px] rounded-full bg-ivory/10" style={{ width: '100%' }} />
          <div className="contract-line h-[3px] rounded-full bg-ivory/10" style={{ width: '85%' }} />
          <div className="contract-line h-[3px] rounded-full bg-ivory/10" style={{ width: '92%' }} />
          <div className="contract-line h-[3px] rounded-full bg-ivory/10" style={{ width: '78%' }} />
        </div>

        {/* Total amount */}
        <div className="contract-total flex justify-between items-center py-2 border-t border-ivory/10 mb-3">
          <span className="text-[9px] uppercase tracking-wider text-body">Total</span>
          <span className="font-display text-lg text-ivory font-light">$42,500</span>
        </div>

        {/* Signature area */}
        <div className="signature-area">
          <div className="text-[8px] uppercase tracking-wider text-body/60 mb-1">
            Customer Signature
          </div>
          <div
            className="signature-line h-8 rounded border border-dashed border-ivory/20 relative overflow-hidden"
            style={{ background: 'rgba(15, 16, 18, 0.5)' }}
          >
            {/* Animated signature SVG */}
            <svg
              className="signature-svg absolute inset-0 w-full h-full"
              viewBox="0 0 200 40"
              preserveAspectRatio="xMidYMid meet"
            >
              <path
                className="signature-path"
                d="M 20 28 C 30 28, 35 15, 45 20 C 55 25, 50 28, 65 22 C 80 16, 75 30, 90 25 C 100 22, 95 18, 110 20 C 120 22, 115 28, 130 24 C 140 20, 145 26, 155 22 C 165 18, 170 24, 180 22"
                fill="none"
                stroke="#C88D74"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeDasharray="300"
                strokeDashoffset="300"
                style={{
                  filter: 'drop-shadow(0 0 4px rgba(212, 168, 75, 0.5))',
                }}
              />
            </svg>
          </div>
        </div>
      </div>

      {/* Success badge */}
      <div
        className="success-badge flex items-center gap-2 mt-4 px-4 py-2 rounded-full"
        style={{
          background: 'rgba(207, 255, 4, 0.1)',
          border: '1px solid rgba(207, 255, 4, 0.4)',
          boxShadow: '0 0 20px rgba(207, 255, 4, 0.2)',
          opacity: 0,
          transform: 'scale(0.8)',
        }}
      >
        {/* Animated checkmark */}
        <svg
          className="checkmark-svg w-4 h-4"
          viewBox="0 0 24 24"
          fill="none"
        >
          <circle
            className="checkmark-circle"
            cx="12"
            cy="12"
            r="10"
            stroke="#CFFF04"
            strokeWidth="2"
            fill="none"
            strokeDasharray="63"
            strokeDashoffset="63"
          />
          <path
            className="checkmark-tick"
            d="M 7 12 L 10 15 L 17 8"
            stroke="#CFFF04"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
            strokeDasharray="20"
            strokeDashoffset="20"
          />
        </svg>
        <span className="text-[11px] font-body font-medium uppercase tracking-wider text-signal">
          Signed!
        </span>
      </div>
    </div>
  );
});

ContractStage.displayName = 'ContractStage';
