interface DimensionLineProps {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  label: string;
  className?: string;
}

export function DimensionLine({ x1, y1, x2, y2, label, className = '' }: DimensionLineProps) {
  const length = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
  const midX = (x1 + x2) / 2;
  const midY = (y1 + y2) / 2;

  // Calculate angle for label positioning
  const angle = Math.atan2(y2 - y1, x2 - x1) * (180 / Math.PI);
  const isVertical = Math.abs(angle) > 45 && Math.abs(angle) < 135;

  // Perpendicular offset for label
  const labelOffset = isVertical ? { x: 8, y: 0 } : { x: 0, y: -6 };

  // End cap size
  const capSize = 4;

  // Calculate perpendicular direction for end caps
  const perpX = -(y2 - y1) / length;
  const perpY = (x2 - x1) / length;

  return (
    <g className={`dimension-line ${className}`}>
      {/* Main line */}
      <line
        className="dimension-line-main"
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        stroke="#C88D74"
        strokeWidth="0.8"
        strokeDasharray={length}
        strokeDashoffset={length}
        strokeLinecap="round"
      />

      {/* Start cap */}
      <line
        className="dimension-cap dimension-cap-start"
        x1={x1 + perpX * capSize}
        y1={y1 + perpY * capSize}
        x2={x1 - perpX * capSize}
        y2={y1 - perpY * capSize}
        stroke="#C88D74"
        strokeWidth="0.8"
        opacity="0"
        strokeLinecap="round"
      />

      {/* End cap */}
      <line
        className="dimension-cap dimension-cap-end"
        x1={x2 + perpX * capSize}
        y1={y2 + perpY * capSize}
        x2={x2 - perpX * capSize}
        y2={y2 - perpY * capSize}
        stroke="#C88D74"
        strokeWidth="0.8"
        opacity="0"
        strokeLinecap="round"
      />

      {/* Glow endpoints */}
      <circle
        className="dimension-endpoint"
        cx={x1}
        cy={y1}
        r="1.5"
        fill="#CFFF04"
        opacity="0"
      />
      <circle
        className="dimension-endpoint"
        cx={x2}
        cy={y2}
        r="1.5"
        fill="#CFFF04"
        opacity="0"
      />

      {/* Label background */}
      <rect
        className="dimension-label-bg"
        x={midX + labelOffset.x - 10}
        y={midY + labelOffset.y - 4}
        width="20"
        height="8"
        fill="#0F1012"
        opacity="0"
        rx="1"
      />

      {/* Label text */}
      <text
        className="dimension-label"
        x={midX + labelOffset.x}
        y={midY + labelOffset.y}
        textAnchor="middle"
        dominantBaseline="middle"
        fill="#faf8f4"
        fontSize="4"
        fontFamily="var(--font-body)"
        fontWeight="500"
        letterSpacing="0.05em"
        opacity="0"
      >
        {label}
      </text>
    </g>
  );
}
