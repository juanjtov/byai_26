import { forwardRef } from 'react';

export const RenderStage = forwardRef<HTMLDivElement>((_, ref) => {
  return (
    <div
      ref={ref}
      className="absolute inset-0 flex flex-col items-center justify-center render-stage"
      style={{ opacity: 0 }}
    >
      {/* Isometric Kitchen Render */}
      <svg
        className="w-[95%] h-[80%] max-w-[380px]"
        viewBox="0 0 300 220"
        fill="none"
        style={{ filter: 'drop-shadow(0 4px 20px rgba(0,0,0,0.3))' }}
      >
        <defs>
          {/* Wood grain pattern */}
          <pattern id="wood-grain" patternUnits="userSpaceOnUse" width="20" height="20">
            <rect width="20" height="20" fill="#8B6F5C" />
            <line x1="0" y1="3" x2="20" y2="3" stroke="#7A5F4D" strokeWidth="0.5" opacity="0.5" />
            <line x1="0" y1="8" x2="20" y2="8" stroke="#7A5F4D" strokeWidth="0.3" opacity="0.3" />
            <line x1="0" y1="14" x2="20" y2="14" stroke="#7A5F4D" strokeWidth="0.5" opacity="0.4" />
            <line x1="0" y1="18" x2="20" y2="18" stroke="#7A5F4D" strokeWidth="0.3" opacity="0.3" />
          </pattern>

          {/* Marble pattern */}
          <pattern id="marble" patternUnits="userSpaceOnUse" width="40" height="40">
            <rect width="40" height="40" fill="#E8E4E0" />
            <path d="M 0 20 Q 10 15, 20 22 T 40 18" stroke="#C5C0B8" strokeWidth="0.8" fill="none" opacity="0.4" />
            <path d="M 5 35 Q 15 30, 30 38" stroke="#D0CBC5" strokeWidth="0.5" fill="none" opacity="0.3" />
            <path d="M 10 5 Q 25 8, 35 3" stroke="#C5C0B8" strokeWidth="0.6" fill="none" opacity="0.35" />
          </pattern>

          {/* Floor tile pattern */}
          <pattern id="floor-tile" patternUnits="userSpaceOnUse" width="30" height="15">
            <rect width="30" height="15" fill="#3D3530" />
            <rect x="0" y="0" width="14" height="7" fill="#4A4035" rx="0.5" />
            <rect x="15" y="0" width="14" height="7" fill="#453B30" rx="0.5" />
            <rect x="7" y="8" width="14" height="6" fill="#4A4035" rx="0.5" />
          </pattern>

          {/* Gradients */}
          <linearGradient id="cabinet-wood" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#A17F68" />
            <stop offset="50%" stopColor="#8B6F5C" />
            <stop offset="100%" stopColor="#7A5F4D" />
          </linearGradient>

          <linearGradient id="cabinet-side" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#6B5545" />
            <stop offset="100%" stopColor="#5A4538" />
          </linearGradient>

          <linearGradient id="counter-top" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#F5F2EE" />
            <stop offset="100%" stopColor="#E8E4E0" />
          </linearGradient>

          <linearGradient id="counter-edge" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#E0DCD8" />
            <stop offset="100%" stopColor="#D0CBC5" />
          </linearGradient>

          <linearGradient id="wall-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#2A2520" />
            <stop offset="100%" stopColor="#1F1B18" />
          </linearGradient>

          <linearGradient id="brass" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#D4A84B" />
            <stop offset="50%" stopColor="#C9983D" />
            <stop offset="100%" stopColor="#B8872F" />
          </linearGradient>

          {/* Glow filters */}
          <filter id="pendant-glow" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          <filter id="soft-shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="2" dy="4" stdDeviation="3" floodOpacity="0.3" />
          </filter>
        </defs>

        {/* === FLOOR === */}
        <g className="floor-grid" style={{ opacity: 0 }}>
          <polygon
            points="20,180 150,220 280,180 150,140"
            fill="url(#floor-tile)"
          />
          {/* Floor shadow under island */}
          <ellipse cx="150" cy="185" rx="50" ry="12" fill="rgba(0,0,0,0.2)" />
        </g>

        {/* === BACK WALL === */}
        <g className="back-wall" style={{ opacity: 0 }}>
          <polygon
            points="20,180 20,50 150,10 280,50 280,180 150,140"
            fill="url(#wall-gradient)"
          />

          {/* Backsplash tile pattern */}
          <polygon
            points="35,140 35,85 145,55 255,85 255,140 145,110"
            fill="#252220"
            stroke="#3A3530"
            strokeWidth="0.5"
          />

          {/* Window */}
          <g className="window">
            <rect x="100" y="25" width="50" height="35" rx="2" fill="#1A1815" stroke="#3A3530" strokeWidth="1" />
            <line x1="125" y1="25" x2="125" y2="60" stroke="#3A3530" strokeWidth="1" />
            <line x1="100" y1="42" x2="150" y2="42" stroke="#3A3530" strokeWidth="1" />
            {/* Window glow */}
            <rect x="102" y="27" width="21" height="13" fill="#2A3540" opacity="0.6" />
            <rect x="127" y="27" width="21" height="13" fill="#2A3540" opacity="0.6" />
          </g>
        </g>

        {/* === LEFT UPPER CABINETS === */}
        <g className="cabinet-upper-left" style={{ opacity: 0 }} filter="url(#soft-shadow)">
          {/* Cabinet front */}
          <polygon
            points="30,70 30,120 70,105 70,55"
            fill="url(#cabinet-wood)"
            stroke="#5A4538"
            strokeWidth="0.5"
          />
          {/* Cabinet side */}
          <polygon
            points="70,55 70,105 85,100 85,50"
            fill="url(#cabinet-side)"
          />
          {/* Cabinet top */}
          <polygon
            points="30,70 70,55 85,50 45,65"
            fill="#9A7A63"
          />
          {/* Handle */}
          <rect x="45" y="82" width="12" height="3" rx="1.5" fill="url(#brass)" />
          {/* Wood grain lines */}
          <line x1="35" y1="75" x2="65" y2="62" stroke="#7A5F4D" strokeWidth="0.3" opacity="0.4" />
          <line x1="35" y1="95" x2="65" y2="82" stroke="#7A5F4D" strokeWidth="0.3" opacity="0.4" />
        </g>

        {/* === RIGHT UPPER CABINETS === */}
        <g className="cabinet-upper-right" style={{ opacity: 0 }} filter="url(#soft-shadow)">
          {/* Cabinet side */}
          <polygon
            points="215,50 215,100 230,105 230,55"
            fill="url(#cabinet-side)"
          />
          {/* Cabinet front */}
          <polygon
            points="230,55 230,105 270,120 270,70"
            fill="url(#cabinet-wood)"
            stroke="#5A4538"
            strokeWidth="0.5"
          />
          {/* Cabinet top */}
          <polygon
            points="215,50 230,55 270,70 255,65"
            fill="#9A7A63"
          />
          {/* Handle */}
          <rect x="243" y="82" width="12" height="3" rx="1.5" fill="url(#brass)" />
          {/* Wood grain lines */}
          <line x1="235" y1="62" x2="265" y2="75" stroke="#7A5F4D" strokeWidth="0.3" opacity="0.4" />
          <line x1="235" y1="82" x2="265" y2="95" stroke="#7A5F4D" strokeWidth="0.3" opacity="0.4" />
        </g>

        {/* === LEFT BASE CABINET WITH COUNTER === */}
        <g className="counter-left" style={{ opacity: 0 }} filter="url(#soft-shadow)">
          {/* Base cabinet */}
          <polygon
            points="25,175 25,125 75,108 75,158"
            fill="url(#cabinet-wood)"
            stroke="#5A4538"
            strokeWidth="0.5"
          />
          <polygon
            points="75,108 75,158 95,152 95,102"
            fill="url(#cabinet-side)"
          />
          {/* Countertop */}
          <polygon
            points="20,125 80,105 100,100 40,120"
            fill="url(#counter-top)"
          />
          <polygon
            points="20,125 20,128 40,123 40,120"
            fill="url(#counter-edge)"
          />
          {/* Sink */}
          <ellipse cx="55" cy="112" rx="12" ry="5" fill="#D5D0CA" stroke="#B5B0AA" strokeWidth="0.5" />
          <ellipse cx="55" cy="112" rx="9" ry="3.5" fill="#1A1815" />
          {/* Faucet */}
          <path d="M 68 108 L 68 100 Q 68 96 72 96 L 72 98" stroke="url(#brass)" strokeWidth="2.5" fill="none" strokeLinecap="round" />
          {/* Handle */}
          <rect x="42" y="138" width="10" height="3" rx="1.5" fill="url(#brass)" />
        </g>

        {/* === RIGHT BASE CABINET WITH COUNTER === */}
        <g className="counter-right" style={{ opacity: 0 }} filter="url(#soft-shadow)">
          {/* Base cabinet side */}
          <polygon
            points="205,102 205,152 225,158 225,108"
            fill="url(#cabinet-side)"
          />
          {/* Base cabinet front */}
          <polygon
            points="225,108 225,158 275,175 275,125"
            fill="url(#cabinet-wood)"
            stroke="#5A4538"
            strokeWidth="0.5"
          />
          {/* Countertop */}
          <polygon
            points="200,100 260,120 280,125 220,105"
            fill="url(#counter-top)"
          />
          <polygon
            points="260,120 260,123 280,128 280,125"
            fill="url(#counter-edge)"
          />
          {/* Stovetop */}
          <rect x="225" y="108" width="35" height="18" rx="2" fill="#2A2520" />
          <circle cx="235" cy="114" r="5" fill="none" stroke="#C88D74" strokeWidth="1" />
          <circle cx="235" cy="114" r="2.5" fill="none" stroke="#C88D74" strokeWidth="0.5" opacity="0.6" />
          <circle cx="250" cy="114" r="5" fill="none" stroke="#C88D74" strokeWidth="1" />
          <circle cx="250" cy="114" r="2.5" fill="none" stroke="#C88D74" strokeWidth="0.5" opacity="0.6" />
          {/* Handle */}
          <rect x="248" y="140" width="10" height="3" rx="1.5" fill="url(#brass)" />
        </g>

        {/* === RANGE HOOD === */}
        <g className="range-hood" style={{ opacity: 0 }}>
          <polygon
            points="195,65 195,85 255,100 255,80"
            fill="#2A2520"
            stroke="#3A3530"
            strokeWidth="0.5"
          />
          <polygon
            points="195,65 255,80 265,75 205,60"
            fill="#353025"
          />
          <rect x="210" y="72" width="30" height="3" rx="1" fill="#C88D74" opacity="0.4" />
        </g>

        {/* === KITCHEN ISLAND === */}
        <g className="kitchen-island" style={{ opacity: 0 }} filter="url(#soft-shadow)">
          {/* Island base - front */}
          <polygon
            points="80,200 80,165 150,150 220,165 220,200 150,185"
            fill="url(#cabinet-wood)"
            stroke="#5A4538"
            strokeWidth="0.5"
          />
          {/* Island base - left side */}
          <polygon
            points="80,165 80,200 90,205 90,170"
            fill="url(#cabinet-side)"
          />
          {/* Island base - right side */}
          <polygon
            points="210,170 210,205 220,200 220,165"
            fill="url(#cabinet-side)"
          />

          {/* Island countertop - main surface */}
          <polygon
            points="75,165 150,145 225,165 150,185"
            fill="url(#marble)"
            stroke="#D0CBC5"
            strokeWidth="0.5"
          />

          {/* Waterfall edge - left */}
          <polygon
            points="75,165 75,175 85,180 85,170"
            fill="url(#counter-edge)"
          />
          {/* Waterfall edge - right */}
          <polygon
            points="215,170 215,180 225,175 225,165"
            fill="url(#counter-edge)"
          />

          {/* Prep items on island */}
          {/* Cutting board */}
          <rect x="100" y="155" width="25" height="15" rx="2" fill="#A17F68" transform="rotate(-5 112 162)" />

          {/* Bowl with fruit */}
          <ellipse cx="175" cy="160" rx="15" ry="6" fill="#E8E4E0" stroke="#D0CBC5" strokeWidth="0.5" />
          <circle cx="172" cy="158" r="4" fill="#E8A087" />
          <circle cx="178" cy="157" r="3.5" fill="#D4A84B" />
          <circle cx="175" cy="155" r="3" fill="#8B9E7D" />

          {/* Handles on front */}
          <rect x="105" y="178" width="10" height="3" rx="1.5" fill="url(#brass)" />
          <rect x="145" y="181" width="10" height="3" rx="1.5" fill="url(#brass)" />
          <rect x="185" y="178" width="10" height="3" rx="1.5" fill="url(#brass)" />
        </g>

        {/* === PENDANT LIGHTS === */}
        <g className="pendant-lights" style={{ opacity: 0 }}>
          {/* Left pendant */}
          <line x1="120" y1="0" x2="120" y2="70" stroke="#3A3530" strokeWidth="1" />
          <ellipse cx="120" cy="75" rx="12" ry="5" fill="#2A2520" stroke="#D4A84B" strokeWidth="0.5" />
          <ellipse cx="120" cy="73" rx="8" ry="3" fill="#CFFF04" opacity="0.6" filter="url(#pendant-glow)" />
          <circle cx="120" cy="73" r="3" fill="#CFFF04" />

          {/* Right pendant */}
          <line x1="180" y1="0" x2="180" y2="70" stroke="#3A3530" strokeWidth="1" />
          <ellipse cx="180" cy="75" rx="12" ry="5" fill="#2A2520" stroke="#D4A84B" strokeWidth="0.5" />
          <ellipse cx="180" cy="73" rx="8" ry="3" fill="#CFFF04" opacity="0.6" filter="url(#pendant-glow)" />
          <circle cx="180" cy="73" r="3" fill="#CFFF04" />

          {/* Light glow effect on counter */}
          <ellipse cx="150" cy="165" rx="40" ry="15" fill="#CFFF04" opacity="0.05" />
        </g>

        {/* === DECORATIVE PLANT === */}
        <g className="decor-plant" style={{ opacity: 0 }}>
          <rect x="35" y="118" width="8" height="10" rx="1" fill="#3A3530" />
          <ellipse cx="39" cy="115" rx="8" ry="6" fill="#5A6B50" />
          <ellipse cx="36" cy="113" rx="5" ry="4" fill="#6B7D5F" />
          <ellipse cx="42" cy="112" rx="4" ry="3" fill="#768A6A" />
        </g>
      </svg>

      {/* Rendering indicator */}
      <div
        className="render-indicator flex items-center gap-2 mt-1"
        style={{ opacity: 0 }}
      >
        <div className="flex gap-1">
          <div className="render-dot w-1.5 h-1.5 rounded-full bg-copper" style={{ opacity: 0 }} />
          <div className="render-dot w-1.5 h-1.5 rounded-full bg-copper" style={{ opacity: 0 }} />
          <div className="render-dot w-1.5 h-1.5 rounded-full bg-copper" style={{ opacity: 0 }} />
        </div>
        <span className="text-[9px] font-body uppercase tracking-wider text-body">
          3D Preview
        </span>
      </div>

      {/* Material labels */}
      <div
        className="material-labels flex gap-3 mt-2"
        style={{ opacity: 0 }}
      >
        {[
          { name: 'Walnut', color: '#8B6F5C' },
          { name: 'Marble', color: '#E8E4E0' },
          { name: 'Brass', color: '#D4A84B' },
        ].map((material) => (
          <div
            key={material.name}
            className="flex items-center gap-1.5"
          >
            <div
              className="w-2 h-2 rounded-sm"
              style={{ backgroundColor: material.color }}
            />
            <span className="text-[8px] font-body uppercase tracking-wider text-body/80">
              {material.name}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
});

RenderStage.displayName = 'RenderStage';
