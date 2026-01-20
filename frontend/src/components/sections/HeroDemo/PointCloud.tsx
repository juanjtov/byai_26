import { useMemo, forwardRef } from 'react';

interface Point {
  x: number;
  y: number;
  color: 'copper' | 'sage' | 'signal';
  size: number;
  delay: number;
}

const COLOR_VALUES = {
  copper: '#C88D74',
  sage: '#768A86',
  signal: '#CFFF04',
};

function generateRoomPoints(): Point[] {
  const points: Point[] = [];

  // Room outline - L-shaped floor plan
  // Left wall
  for (let i = 0; i < 12; i++) {
    points.push({
      x: 8 + Math.random() * 4,
      y: 10 + i * 7 + Math.random() * 3,
      color: Math.random() > 0.8 ? 'signal' : 'copper',
      size: 2 + Math.random() * 2,
      delay: (10 + i * 7) / 100,
    });
  }

  // Bottom wall
  for (let i = 0; i < 10; i++) {
    points.push({
      x: 10 + i * 8 + Math.random() * 3,
      y: 85 + Math.random() * 4,
      color: Math.random() > 0.8 ? 'signal' : 'copper',
      size: 2 + Math.random() * 2,
      delay: 0.85,
    });
  }

  // Right wall (partial - L shape)
  for (let i = 0; i < 8; i++) {
    points.push({
      x: 88 + Math.random() * 4,
      y: 45 + i * 6 + Math.random() * 3,
      color: Math.random() > 0.8 ? 'signal' : 'copper',
      size: 2 + Math.random() * 2,
      delay: (45 + i * 6) / 100,
    });
  }

  // Top wall
  for (let i = 0; i < 6; i++) {
    points.push({
      x: 50 + i * 7 + Math.random() * 3,
      y: 8 + Math.random() * 4,
      color: Math.random() > 0.8 ? 'signal' : 'copper',
      size: 2 + Math.random() * 2,
      delay: 0.08,
    });
  }

  // L-shape inner corner
  for (let i = 0; i < 5; i++) {
    points.push({
      x: 48 + Math.random() * 4,
      y: 10 + i * 8 + Math.random() * 3,
      color: Math.random() > 0.7 ? 'signal' : 'copper',
      size: 2 + Math.random() * 2,
      delay: (10 + i * 8) / 100,
    });
  }

  for (let i = 0; i < 4; i++) {
    points.push({
      x: 50 + i * 10 + Math.random() * 3,
      y: 43 + Math.random() * 4,
      color: Math.random() > 0.7 ? 'signal' : 'copper',
      size: 2 + Math.random() * 2,
      delay: 0.43,
    });
  }

  // Interior fixtures (sage colored)
  // Kitchen island
  for (let i = 0; i < 6; i++) {
    points.push({
      x: 55 + Math.random() * 20,
      y: 60 + Math.random() * 15,
      color: 'sage',
      size: 2.5 + Math.random() * 1.5,
      delay: 0.6 + Math.random() * 0.15,
    });
  }

  // Cabinet outline
  for (let i = 0; i < 5; i++) {
    points.push({
      x: 20 + Math.random() * 15,
      y: 20 + Math.random() * 20,
      color: 'sage',
      size: 2 + Math.random() * 1.5,
      delay: 0.2 + Math.random() * 0.2,
    });
  }

  // Random floor noise (sparse)
  for (let i = 0; i < 20; i++) {
    points.push({
      x: 20 + Math.random() * 60,
      y: 30 + Math.random() * 45,
      color: Math.random() > 0.5 ? 'copper' : 'sage',
      size: 1.5 + Math.random() * 1,
      delay: Math.random() * 0.8,
    });
  }

  // Corner detail points (signal green for detected edges)
  const corners = [
    { x: 10, y: 10 },
    { x: 10, y: 85 },
    { x: 88, y: 85 },
    { x: 88, y: 45 },
    { x: 50, y: 45 },
    { x: 50, y: 10 },
  ];

  corners.forEach((corner) => {
    for (let i = 0; i < 3; i++) {
      points.push({
        x: corner.x + (Math.random() - 0.5) * 6,
        y: corner.y + (Math.random() - 0.5) * 6,
        color: 'signal',
        size: 3 + Math.random() * 1.5,
        delay: corner.y / 100,
      });
    }
  });

  return points;
}

export const PointCloud = forwardRef<SVGSVGElement>((_, ref) => {
  const points = useMemo(() => generateRoomPoints(), []);

  return (
    <svg
      ref={ref}
      className="absolute inset-0 w-full h-full"
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
    >
      <defs>
        <filter id="point-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="0.8" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {points.map((point, i) => (
        <circle
          key={i}
          className="point-cloud-dot"
          cx={point.x}
          cy={point.y}
          r={point.size / 2.5}
          fill={COLOR_VALUES[point.color]}
          filter={point.color === 'signal' ? 'url(#point-glow)' : undefined}
          opacity={0}
          style={{
            transform: 'scale(0)',
            transformOrigin: `${point.x}px ${point.y}px`,
          }}
          data-delay={point.delay}
        />
      ))}
    </svg>
  );
});

PointCloud.displayName = 'PointCloud';
