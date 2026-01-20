import { forwardRef } from 'react';
import { DimensionLine } from '../DimensionLine';

export const MeasurementsStage = forwardRef<SVGSVGElement>((_, ref) => {
  return (
    <svg
      ref={ref}
      className="absolute inset-0 w-full h-full measurements-stage"
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      style={{ opacity: 0 }}
    >
      <defs>
        <filter id="glow-signal" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="1" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Width measurement (bottom wall) */}
      <DimensionLine
        x1={10}
        y1={92}
        x2={88}
        y2={92}
        label="12.4 ft"
        className="dim-width"
      />

      {/* Height measurement (left wall) */}
      <DimensionLine
        x1={4}
        y1={10}
        x2={4}
        y2={85}
        label="9.2 ft"
        className="dim-height"
      />

      {/* L-shape horizontal */}
      <DimensionLine
        x1={50}
        y1={38}
        x2={88}
        y2={38}
        label="5.8 ft"
        className="dim-inner-h"
      />

      {/* Area display in center */}
      <g className="area-display" style={{ opacity: 0 }}>
        {/* Background panel */}
        <rect
          x="25"
          y="55"
          width="30"
          height="14"
          rx="2"
          fill="#1C1C1E"
          stroke="#C88D74"
          strokeWidth="0.5"
          opacity="0.9"
        />

        {/* Area value */}
        <text
          className="area-value"
          x="40"
          y="63"
          textAnchor="middle"
          dominantBaseline="middle"
          fill="#faf8f4"
          fontSize="5"
          fontFamily="var(--font-display)"
          fontWeight="300"
        >
          114 sqft
        </text>

        {/* Label */}
        <text
          x="40"
          y="67"
          textAnchor="middle"
          dominantBaseline="hanging"
          fill="#B5ADA5"
          fontSize="2.5"
          fontFamily="var(--font-body)"
          letterSpacing="0.1em"
          style={{ textTransform: 'uppercase' }}
        >
          TOTAL AREA
        </text>
      </g>

      {/* Corner markers with glow */}
      {[
        { x: 10, y: 10 },
        { x: 10, y: 85 },
        { x: 88, y: 85 },
        { x: 88, y: 45 },
        { x: 50, y: 45 },
        { x: 50, y: 10 },
      ].map((corner, i) => (
        <g key={i} className="corner-marker" style={{ opacity: 0 }}>
          <circle
            cx={corner.x}
            cy={corner.y}
            r="2"
            fill="#CFFF04"
            filter="url(#glow-signal)"
          />
          <circle
            cx={corner.x}
            cy={corner.y}
            r="1"
            fill="#faf8f4"
          />
        </g>
      ))}
    </svg>
  );
});

MeasurementsStage.displayName = 'MeasurementsStage';
