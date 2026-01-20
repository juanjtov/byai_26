import { useRef, useEffect } from 'react';
import { usePricing } from '@/hooks/usePricing';
import { useGsapAnimations } from '@/hooks/useGsapAnimations';
import { getPackageName, PACKAGE_PRICES } from '@/lib/pricing';
import { PriceSlider } from './PriceSlider';
import { PhoneMockup } from './PhoneMockup';

export function DemoSection() {
  const {
    step,
    setStep,
    currentPackage,
    currentPrice,
    materials,
  } = usePricing();

  const { priceRef, animatePrice, triggerHapticShake, setImageZoom } = useGsapAnimations();
  const phoneRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLDivElement>(null);

  const handleSliderChange = (newStep: number) => {
    setStep(newStep);
    // Get the target price directly from the new step
    const targetPackage = getPackageName(newStep);
    const targetPrice = PACKAGE_PRICES[targetPackage];
    animatePrice(targetPrice);
    triggerHapticShake(phoneRef.current);
    setImageZoom(imageRef.current, newStep);
  };

  // Initialize price display on mount
  useEffect(() => {
    animatePrice(currentPrice);
  }, []);

  return (
    <section id="demo" className="w-full py-20 bg-tungsten relative border-y border-white/5">
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
        {/* Left Column: Controls */}
        <div>
          <h2 className="text-4xl md:text-5xl font-light mb-6 text-ivory">
            Scope Fluidity. <br />
            <span className="text-copper">Price Certainty.</span>
          </h2>
          <p className="text-gray-400 font-light mb-12 max-w-md text-lg">
            Drag the slider. Watch the scope evolve. The price updates instantly. No "let me calculate that and get back to you."
          </p>

          {/* Control Panel */}
          <div className="bg-obsidian p-8 rounded-2xl border border-white/10 shadow-2xl">
            <PriceSlider
              step={step}
              onChange={handleSliderChange}
              currentPackage={currentPackage}
            />

            {/* 2x2 Materials Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-tungsten p-4 rounded border border-white/5">
                <div className="text-[10px] font-mono text-gray-500 uppercase mb-1">Flooring</div>
                <div className="text-sm text-white">{materials.flooring}</div>
              </div>
              <div className="bg-tungsten p-4 rounded border border-white/5">
                <div className="text-[10px] font-mono text-gray-500 uppercase mb-1">Cabinets</div>
                <div className="text-sm text-white">{materials.cabinets}</div>
              </div>
              <div className="bg-tungsten p-4 rounded border border-white/5">
                <div className="text-[10px] font-mono text-gray-500 uppercase mb-1">Countertops</div>
                <div className="text-sm text-white">{materials.countertop}</div>
              </div>
              <div className="bg-tungsten p-4 rounded border border-white/5">
                <div className="text-[10px] font-mono text-gray-500 uppercase mb-1">Timeline</div>
                <div className="text-sm text-white">{materials.timeline}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Phone Mockup */}
        <div className="relative flex justify-center lg:justify-end">
          <PhoneMockup
            ref={phoneRef}
            priceRef={priceRef}
            imageRef={imageRef}
          />
        </div>
      </div>
    </section>
  );
}
