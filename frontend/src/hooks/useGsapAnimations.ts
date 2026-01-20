import { useRef, useCallback } from 'react';
import gsap from 'gsap';

export function useGsapAnimations() {
  const priceRef = useRef<HTMLSpanElement>(null);
  const priceState = useRef({ value: 42500 });

  const animatePrice = useCallback((to: number) => {
    const obj = priceState.current;
    gsap.to(obj, {
      value: to,
      duration: 0.5,
      ease: 'power2.out',
      onUpdate: () => {
        if (priceRef.current) {
          priceRef.current.textContent = Math.round(obj.value).toLocaleString('en-US');
        }
      },
    });
  }, []);

  const triggerHapticShake = useCallback((element: HTMLElement | null) => {
    if (!element) return;

    gsap.fromTo(element,
      { x: -2 },
      { x: 0, duration: 0.1, repeat: 1, yoyo: true }
    );
  }, []);

  const setImageZoom = useCallback((imageElement: HTMLElement | null, step: number) => {
    if (!imageElement) return;

    // Premium (step 2) gets zoomed in, Economy (step 0) is normal
    const scale = step === 2 ? 1.05 : 1;
    imageElement.style.transform = `scale(${scale})`;
  }, []);

  return {
    priceRef,
    animatePrice,
    triggerHapticShake,
    setImageZoom,
  };
}
