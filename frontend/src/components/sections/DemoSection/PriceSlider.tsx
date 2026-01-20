interface PriceSliderProps {
  step: number;
  onChange: (step: number) => void;
  currentPackage: string;
}

export function PriceSlider({ step, onChange, currentPackage }: PriceSliderProps) {
  return (
    <div className="relative">
      {/* Finish Level Header */}
      <div className="flex justify-between items-center mb-6">
        <span className="font-mono text-xs text-gray-500 tracking-widest">FINISH LEVEL</span>
        <span className="font-mono text-xs text-signal tracking-widest">{currentPackage.toUpperCase()}</span>
      </div>

      {/* Native range input with custom styling via CSS */}
      <input
        type="range"
        min={0}
        max={2}
        step={1}
        value={step}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full mb-8 cursor-pointer"
        aria-label="Finish level slider"
      />
    </div>
  );
}
