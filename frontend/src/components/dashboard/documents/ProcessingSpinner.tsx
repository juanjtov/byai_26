interface ProcessingSpinnerProps {
  size?: number;
}

export function ProcessingSpinner({ size = 16 }: ProcessingSpinnerProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      className="animate-spin"
    >
      <defs>
        <linearGradient id="processingGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#C88D74" />
          <stop offset="100%" stopColor="#768A86" />
        </linearGradient>
      </defs>
      <circle
        cx="12"
        cy="12"
        r="10"
        fill="none"
        stroke="url(#processingGradient)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeDasharray="62.83"
        strokeDashoffset="15"
      />
    </svg>
  );
}
