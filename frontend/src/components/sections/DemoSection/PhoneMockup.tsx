import { forwardRef } from 'react';
import { ChevronLeft, Share, ArrowRight } from 'lucide-react';

interface PhoneMockupProps {
  priceRef: React.RefObject<HTMLSpanElement | null>;
  imageRef: React.RefObject<HTMLDivElement | null>;
}

export const PhoneMockup = forwardRef<HTMLDivElement, PhoneMockupProps>(
  ({ priceRef, imageRef }, ref) => {
    return (
      <div
        ref={ref}
        id="phone-container"
        className="w-[320px] h-[640px] bg-obsidian rounded-[3rem] border-8 border-surface-light shadow-2xl relative overflow-hidden"
      >
        {/* Notch */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-black rounded-b-2xl z-20" />

        {/* App UI */}
        <div className="p-6 h-full flex flex-col pt-12">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <ChevronLeft className="text-white w-5 h-5" />
            <span className="font-mono text-[10px] tracking-widest text-gray-400">ESTIMATE #2941</span>
            <Share className="text-white w-5 h-5" />
          </div>

          {/* 3D Room Image */}
          <div className="h-48 bg-tungsten rounded-xl mb-6 relative overflow-hidden border border-white/5 group">
            <div
              ref={imageRef}
              className="absolute inset-0 bg-cover bg-center transition-transform duration-700"
              style={{
                backgroundImage: "url('https://images.unsplash.com/photo-1600607686527-6fb886090705?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80')",
                transform: 'scale(1.05)',
              }}
            />
            <div className="absolute inset-0 bg-black/40" />
            <div className="absolute bottom-3 left-3 flex gap-2">
              <span className="bg-black/60 backdrop-blur text-white text-[10px] px-2 py-1 rounded font-mono">Kitchen</span>
              <span className="bg-black/60 backdrop-blur text-copper text-[10px] px-2 py-1 rounded font-mono">245 sqft</span>
            </div>
          </div>

          {/* Price Ticker */}
          <div className="text-center mb-8">
            <div className="text-gray-500 text-xs font-mono mb-1">TOTAL ESTIMATE</div>
            <div className="text-4xl font-light text-white tracking-tight flex justify-center">
              $<span ref={priceRef} className="font-mono font-medium tabular-nums">42,500</span>
            </div>
          </div>

          {/* Risk Meter Mini */}
          <div className="bg-tungsten/50 rounded-lg p-3 flex items-center justify-between mb-4 border border-white/5">
            <span className="text-xs text-gray-400">Confidence Score</span>
            <span className="text-xs text-signal font-mono">98%</span>
          </div>

          {/* Lock & Sign Button */}
          <div className="mt-auto">
            <button className="w-full bg-copper text-white py-4 rounded-xl font-medium tracking-wide shadow-lg shadow-copper/20 flex justify-between px-6 items-center group">
              <span>Lock & Sign</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
            <p className="text-[10px] text-gray-600 text-center mt-3">Generates legal addendum instantly.</p>
          </div>
        </div>
      </div>
    );
  }
);

PhoneMockup.displayName = 'PhoneMockup';
