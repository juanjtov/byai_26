import { useRef, useState, useEffect, useCallback } from 'react';
import gsap from 'gsap';
import { HeroDemoMockup } from './HeroDemoMockup';
import { ScanStage } from './stages/ScanStage';
import { MeasurementsStage } from './stages/MeasurementsStage';
import { RenderStage } from './stages/RenderStage';
import { EstimateStage } from './stages/EstimateStage';
import { ContractStage } from './stages/ContractStage';
import { StageIndicator } from './StageIndicator';

type DemoPhase = 'scan' | 'measurements' | 'render' | 'estimate' | 'contract';

const TOTAL_DURATION = 10; // 10 seconds per loop (5 phases x 2s each)

export function HeroDemo() {
  const containerRef = useRef<HTMLDivElement>(null);
  const scanRef = useRef<HTMLDivElement>(null);
  const pointCloudRef = useRef<SVGSVGElement>(null);
  const measurementsRef = useRef<SVGSVGElement>(null);
  const renderRef = useRef<HTMLDivElement>(null);
  const estimateRef = useRef<HTMLDivElement>(null);
  const contractRef = useRef<HTMLDivElement>(null);
  const timelineRef = useRef<gsap.core.Timeline | null>(null);

  const [currentPhase, setCurrentPhase] = useState<DemoPhase>('scan');
  const [progress, setProgress] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  // Check for reduced motion preference
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  // Intersection observer for visibility
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => setIsVisible(entry.isIntersecting),
      { threshold: 0.3 }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, []);

  // Build the GSAP timeline
  const buildTimeline = useCallback(() => {
    if (!scanRef.current || !pointCloudRef.current || !measurementsRef.current ||
        !renderRef.current || !estimateRef.current || !contractRef.current) return;

    const tl = gsap.timeline({
      repeat: -1,
      repeatDelay: 0,
      paused: !isVisible || prefersReducedMotion,
      onUpdate: () => {
        const time = tl.time() % TOTAL_DURATION;
        const normalizedProgress = (time / TOTAL_DURATION) * 100;
        setProgress(normalizedProgress);

        if (time < 2) setCurrentPhase('scan');
        else if (time < 4) setCurrentPhase('measurements');
        else if (time < 6) setCurrentPhase('render');
        else if (time < 8) setCurrentPhase('estimate');
        else setCurrentPhase('contract');
      },
    });

    // ========== PHASE 1: SCAN (0s - 2s) ==========
    tl.addLabel('scan', 0);

    // Show scan stage
    tl.set(scanRef.current, { opacity: 1 }, 'scan');

    // Scan beam animation
    tl.fromTo(
      '.scan-beam',
      { top: '0%', opacity: 1 },
      { top: '95%', duration: 1.6, ease: 'power1.inOut' },
      'scan'
    );

    // Beam trail follows
    tl.fromTo(
      '.scan-beam-trail',
      { top: '0%', opacity: 0.8 },
      { top: '95%', opacity: 0, duration: 1.6, ease: 'power1.inOut' },
      'scan'
    );

    // Point cloud dots appear with stagger
    tl.to(
      '.point-cloud-dot',
      {
        scale: 1,
        opacity: 1,
        duration: 0.15,
        ease: 'back.out(1.7)',
        stagger: {
          each: 0.012,
          from: 'start',
        },
      },
      'scan+=0.1'
    );

    // Scan progress indicator
    tl.fromTo(
      '.scan-progress',
      { opacity: 0 },
      { opacity: 1, duration: 0.3 },
      'scan+=0.2'
    );
    tl.to('.scan-progress', { opacity: 0, duration: 0.3 }, 'scan+=1.7');

    // ========== PHASE 2: MEASUREMENTS (2s - 4s) ==========
    tl.addLabel('measurements', 2);

    // Fade scan beam
    tl.to('.scan-beam', { opacity: 0, duration: 0.3 }, 'measurements');

    // Show measurements layer
    tl.to(measurementsRef.current, { opacity: 1, duration: 0.3 }, 'measurements');

    // Point cloud fades slightly
    tl.to('.point-cloud-dot', { opacity: 0.4, duration: 0.3 }, 'measurements');

    // Width dimension line
    tl.to(
      '.dim-width .dimension-line-main',
      { strokeDashoffset: 0, duration: 0.4, ease: 'power2.inOut' },
      'measurements+=0.1'
    );
    tl.to(
      '.dim-width .dimension-cap, .dim-width .dimension-endpoint',
      { opacity: 1, duration: 0.2 },
      'measurements+=0.4'
    );
    tl.to(
      '.dim-width .dimension-label-bg, .dim-width .dimension-label',
      { opacity: 1, duration: 0.2 },
      'measurements+=0.5'
    );

    // Height dimension line
    tl.to(
      '.dim-height .dimension-line-main',
      { strokeDashoffset: 0, duration: 0.4, ease: 'power2.inOut' },
      'measurements+=0.6'
    );
    tl.to(
      '.dim-height .dimension-cap, .dim-height .dimension-endpoint',
      { opacity: 1, duration: 0.2 },
      'measurements+=0.9'
    );
    tl.to(
      '.dim-height .dimension-label-bg, .dim-height .dimension-label',
      { opacity: 1, duration: 0.2 },
      'measurements+=1.0'
    );

    // Inner dimension line
    tl.to(
      '.dim-inner-h .dimension-line-main',
      { strokeDashoffset: 0, duration: 0.3, ease: 'power2.inOut' },
      'measurements+=1.1'
    );
    tl.to(
      '.dim-inner-h .dimension-cap, .dim-inner-h .dimension-endpoint, .dim-inner-h .dimension-label-bg, .dim-inner-h .dimension-label',
      { opacity: 1, duration: 0.2 },
      'measurements+=1.3'
    );

    // Corner markers
    tl.to('.corner-marker', { opacity: 1, stagger: 0.05, duration: 0.2 }, 'measurements+=1.2');

    // Area display
    tl.to('.area-display', { opacity: 1, duration: 0.3 }, 'measurements+=1.5');

    // ========== PHASE 3: RENDER (4s - 6s) ==========
    tl.addLabel('render', 4);

    // Fade out measurements and scan
    tl.to([measurementsRef.current, scanRef.current], { opacity: 0, duration: 0.3 }, 'render');

    // Show render stage
    tl.to(renderRef.current, { opacity: 1, duration: 0.3 }, 'render');

    // Floor and back wall appear first
    tl.to('.floor-grid', { opacity: 1, duration: 0.4 }, 'render+=0.1');
    tl.to('.back-wall', { opacity: 1, duration: 0.4 }, 'render+=0.15');

    // Kitchen elements draw in with stagger - isometric build-up effect
    tl.to('.cabinet-upper-left', { opacity: 1, duration: 0.25, ease: 'power2.out' }, 'render+=0.3');
    tl.to('.cabinet-upper-right', { opacity: 1, duration: 0.25, ease: 'power2.out' }, 'render+=0.4');
    tl.to('.range-hood', { opacity: 1, duration: 0.25, ease: 'power2.out' }, 'render+=0.5');
    tl.to('.counter-left', { opacity: 1, duration: 0.25, ease: 'power2.out' }, 'render+=0.6');
    tl.to('.counter-right', { opacity: 1, duration: 0.25, ease: 'power2.out' }, 'render+=0.7');
    tl.to('.decor-plant', { opacity: 1, duration: 0.2, ease: 'power2.out' }, 'render+=0.8');
    tl.to('.kitchen-island', { opacity: 1, duration: 0.35, ease: 'power2.out' }, 'render+=0.9');
    tl.to('.pendant-lights', { opacity: 1, duration: 0.3, ease: 'power2.out' }, 'render+=1.1');

    // Rendering indicator
    tl.to('.render-indicator', { opacity: 1, duration: 0.2 }, 'render+=0.3');
    tl.to('.render-dot', {
      opacity: 1,
      stagger: { each: 0.15, repeat: 3, yoyo: true },
      duration: 0.15,
    }, 'render+=0.4');

    // Material labels
    tl.to('.render-stage .material-labels', { opacity: 1, duration: 0.3 }, 'render+=1.4');

    // ========== PHASE 4: ESTIMATE (6s - 8s) ==========
    tl.addLabel('estimate', 6);

    // Fade out render
    tl.to(renderRef.current, { opacity: 0, duration: 0.3 }, 'estimate');

    // Show estimate stage
    tl.to(estimateRef.current, { opacity: 1, duration: 0.3 }, 'estimate');

    // Price counter animation
    const priceObj = { value: 0 };
    tl.to(
      priceObj,
      {
        value: 42500,
        duration: 0.8,
        ease: 'power2.out',
        onUpdate: () => {
          const priceEl = estimateRef.current?.querySelector('.price-value');
          if (priceEl) {
            priceEl.textContent = '$' + Math.round(priceObj.value).toLocaleString();
          }
        },
      },
      'estimate+=0.2'
    );

    // Tier cards stagger in
    tl.to(
      '.tier-card',
      {
        opacity: 1,
        y: 0,
        stagger: 0.15,
        duration: 0.3,
        ease: 'power2.out',
      },
      'estimate+=0.5'
    );

    // Confidence badge
    tl.to(
      '.confidence-badge',
      { opacity: 1, scale: 1, duration: 0.3, ease: 'back.out(1.7)' },
      'estimate+=1.1'
    );

    // Material chips
    tl.to('.estimate-stage .material-chips', { opacity: 1, duration: 0.3 }, 'estimate+=1.4');

    // ========== PHASE 5: CONTRACT (8s - 10s) ==========
    tl.addLabel('contract', 8);

    // Fade estimate
    tl.to(estimateRef.current, { opacity: 0, duration: 0.3 }, 'contract');

    // Show contract stage
    tl.to(contractRef.current, { opacity: 1, duration: 0.3 }, 'contract');

    // Contract panel slides in
    tl.fromTo(
      '.contract-panel',
      { y: 20, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.4, ease: 'power2.out' },
      'contract+=0.1'
    );

    // Contract lines animate
    tl.fromTo(
      '.contract-line',
      { scaleX: 0, transformOrigin: 'left' },
      { scaleX: 1, stagger: 0.1, duration: 0.2, ease: 'power2.out' },
      'contract+=0.4'
    );

    // Signature path animation
    tl.to(
      '.signature-path',
      { strokeDashoffset: 0, duration: 0.8, ease: 'power2.inOut' },
      'contract+=0.8'
    );

    // Success badge
    tl.to(
      '.success-badge',
      { opacity: 1, scale: 1, duration: 0.3, ease: 'back.out(1.7)' },
      'contract+=1.5'
    );

    // Checkmark circle
    tl.to(
      '.checkmark-circle',
      { strokeDashoffset: 0, duration: 0.3, ease: 'power2.out' },
      'contract+=1.5'
    );

    // Checkmark tick
    tl.to(
      '.checkmark-tick',
      { strokeDashoffset: 0, duration: 0.2, ease: 'power2.out' },
      'contract+=1.7'
    );

    // ========== LOOP RESET (9.7s - 10s) ==========
    // Fade everything for crossfade
    tl.to(
      [scanRef.current, measurementsRef.current, renderRef.current, estimateRef.current, contractRef.current],
      { opacity: 0, duration: 0.3 },
      9.7
    );

    // Reset all elements for next loop
    tl.set('.point-cloud-dot', { scale: 0, opacity: 0 }, TOTAL_DURATION);
    tl.set('.scan-beam', { top: '0%', opacity: 1 }, TOTAL_DURATION);
    tl.set('.scan-beam-trail', { top: '0%', opacity: 0.8 }, TOTAL_DURATION);
    tl.set('.dimension-line-main', { strokeDashoffset: 200 }, TOTAL_DURATION);
    tl.set('.dimension-cap, .dimension-endpoint, .dimension-label-bg, .dimension-label', { opacity: 0 }, TOTAL_DURATION);
    tl.set('.corner-marker, .area-display', { opacity: 0 }, TOTAL_DURATION);
    // Reset render stage
    tl.set('.floor-grid, .back-wall', { opacity: 0 }, TOTAL_DURATION);
    tl.set('.cabinet-upper-left, .cabinet-upper-right, .counter-left, .counter-right, .kitchen-island, .range-hood, .pendant-lights, .decor-plant', { opacity: 0 }, TOTAL_DURATION);
    tl.set('.render-indicator, .render-dot', { opacity: 0 }, TOTAL_DURATION);
    tl.set('.render-stage .material-labels', { opacity: 0 }, TOTAL_DURATION);
    // Reset estimate stage
    tl.set('.tier-card', { opacity: 0, y: 10 }, TOTAL_DURATION);
    tl.set('.confidence-badge', { opacity: 0, scale: 0.9 }, TOTAL_DURATION);
    tl.set('.estimate-stage .material-chips', { opacity: 0 }, TOTAL_DURATION);
    // Reset contract stage
    tl.set('.contract-panel', { y: 20, opacity: 0 }, TOTAL_DURATION);
    tl.set('.contract-line', { scaleX: 0 }, TOTAL_DURATION);
    tl.set('.signature-path', { strokeDashoffset: 300 }, TOTAL_DURATION);
    tl.set('.success-badge', { opacity: 0, scale: 0.8 }, TOTAL_DURATION);
    tl.set('.checkmark-circle', { strokeDashoffset: 63 }, TOTAL_DURATION);
    tl.set('.checkmark-tick', { strokeDashoffset: 20 }, TOTAL_DURATION);
    tl.set(scanRef.current, { opacity: 1 }, TOTAL_DURATION);

    // Reset price counter for next loop
    tl.call(() => {
      const priceEl = estimateRef.current?.querySelector('.price-value');
      if (priceEl) priceEl.textContent = '$0';
      priceObj.value = 0;
    }, [], TOTAL_DURATION);

    return tl;
  }, [isVisible, prefersReducedMotion]);

  // Initialize timeline
  useEffect(() => {
    // Small delay to ensure DOM is ready
    const timeoutId = setTimeout(() => {
      if (timelineRef.current) {
        timelineRef.current.kill();
      }
      timelineRef.current = buildTimeline() || null;
    }, 100);

    return () => {
      clearTimeout(timeoutId);
      if (timelineRef.current) {
        timelineRef.current.kill();
      }
    };
  }, [buildTimeline]);

  // Play/pause based on visibility
  useEffect(() => {
    if (!timelineRef.current) return;

    if (isVisible && !prefersReducedMotion) {
      timelineRef.current.play();
    } else {
      timelineRef.current.pause();
    }
  }, [isVisible, prefersReducedMotion]);

  // Reduced motion fallback - show static state
  if (prefersReducedMotion) {
    return (
      <div ref={containerRef} className="relative">
        <HeroDemoMockup>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="font-display text-2xl text-ivory mb-2">$42,500</div>
              <div className="text-[10px] uppercase tracking-wider text-body">
                Instant Estimate
              </div>
            </div>
          </div>
        </HeroDemoMockup>
        <StageIndicator currentPhase="estimate" progress={70} />
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative" aria-hidden="true">
      <HeroDemoMockup>
        <div className="relative w-full h-full overflow-hidden">
          {/* Scan Stage */}
          <ScanStage ref={scanRef} pointCloudRef={pointCloudRef} />

          {/* Measurements Stage */}
          <MeasurementsStage ref={measurementsRef} />

          {/* Render Stage */}
          <RenderStage ref={renderRef} />

          {/* Estimate Stage */}
          <EstimateStage ref={estimateRef} />

          {/* Contract Stage */}
          <ContractStage ref={contractRef} />
        </div>
      </HeroDemoMockup>

      <StageIndicator currentPhase={currentPhase} progress={progress} />
    </div>
  );
}
