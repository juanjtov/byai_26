interface PriceSliderProps {
  value: number;
  onChange: (value: number) => void;
}

export function PriceSlider({ value, onChange }: PriceSliderProps) {
  return (
    <div className="relative py-4">
      {/* Labels */}
      <div className="mb-4 flex justify-between text-sm">
        <span className={`transition-colors ${value < 33 ? 'text-amber' : 'text-ivory/40'}`}>
          Essential
        </span>
        <span className={`transition-colors ${value >= 33 && value < 67 ? 'text-amber' : 'text-ivory/40'}`}>
          Signature
        </span>
        <span className={`transition-colors ${value >= 67 ? 'text-amber' : 'text-ivory/40'}`}>
          Luxe
        </span>
      </div>

      {/* Slider track background */}
      <div className="relative h-1 rounded-full bg-charcoal-light">
        {/* Filled portion */}
        <div
          className="absolute left-0 top-0 h-full rounded-full bg-gradient-to-r from-charcoal-light to-amber"
          style={{ width: `${value}%` }}
        />

        {/* Tick marks */}
        <div className="absolute left-[33%] top-1/2 h-3 w-px -translate-y-1/2 bg-ivory/10" />
        <div className="absolute left-[67%] top-1/2 h-3 w-px -translate-y-1/2 bg-ivory/10" />
      </div>

      {/* Range input */}
      <input
        type="range"
        min={0}
        max={100}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="absolute inset-0 w-full cursor-pointer opacity-0"
        aria-label="Price range slider"
      />

      {/* Custom thumb */}
      <div
        className="pointer-events-none absolute top-1/2 h-5 w-5 -translate-y-1/2 rounded-full bg-amber shadow-lg shadow-amber/30"
        style={{ left: `calc(${value}% - 10px)` }}
      />
    </div>
  );
}
