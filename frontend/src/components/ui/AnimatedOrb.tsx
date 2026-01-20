interface AnimatedOrbProps {
  color: 'amber' | 'sage';
  size?: number;
  className?: string;
}

export function AnimatedOrb({ color, size = 400, className = '' }: AnimatedOrbProps) {
  const colors = {
    amber: 'bg-amber/20',
    sage: 'bg-sage/15',
  };

  const animations = {
    amber: 'animate-float-1',
    sage: 'animate-float-2',
  };

  return (
    <div
      className={`absolute rounded-full blur-3xl ${colors[color]} ${animations[color]} ${className}`}
      style={{
        width: size,
        height: size,
      }}
    />
  );
}
