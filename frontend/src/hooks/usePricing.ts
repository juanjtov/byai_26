import { useState, useMemo, useCallback } from 'react';
import { calculatePrice, getPackageName, getPackages } from '@/lib/pricing';
import type { Package } from '@/types';

interface UsePricingReturn {
  sliderValue: number;
  setSliderValue: (value: number) => void;
  currentPackage: 'Essential' | 'Signature' | 'Luxe';
  packages: Package[];
  currentPrice: number;
  selectPackage: (packageName: 'Essential' | 'Signature' | 'Luxe') => void;
}

export function usePricing(initialValue = 50): UsePricingReturn {
  const [sliderValue, setSliderValue] = useState(initialValue);

  const currentPrice = useMemo(() => calculatePrice(sliderValue), [sliderValue]);
  const currentPackage = useMemo(() => getPackageName(sliderValue), [sliderValue]);
  const packages = useMemo(() => getPackages(currentPrice), [currentPrice]);

  const selectPackage = useCallback((packageName: 'Essential' | 'Signature' | 'Luxe') => {
    const targetValues = { Essential: 16, Signature: 50, Luxe: 84 };
    setSliderValue(targetValues[packageName]);
  }, []);

  return {
    sliderValue,
    setSliderValue,
    currentPackage,
    packages,
    currentPrice,
    selectPackage,
  };
}
