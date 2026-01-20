import { useState, useMemo, useCallback, useRef } from 'react';
import { getPackageName, getPackages, PACKAGE_PRICES, MATERIAL_DETAILS } from '@/lib/pricing';
import type { Package, PackageTier, MaterialDetails } from '@/types';

interface UsePricingReturn {
  step: number;
  setStep: (step: number) => void;
  currentPackage: PackageTier;
  packages: Package[];
  currentPrice: number;
  previousPrice: number;
  materials: MaterialDetails;
  selectPackage: (packageName: PackageTier) => void;
}

export function usePricing(initialStep = 2): UsePricingReturn {
  const [step, setStepState] = useState(initialStep);
  const previousPriceRef = useRef(PACKAGE_PRICES[getPackageName(initialStep)]);

  const setStep = useCallback((newStep: number) => {
    const currentPackageName = getPackageName(step);
    previousPriceRef.current = PACKAGE_PRICES[currentPackageName];
    setStepState(newStep);
  }, [step]);

  const currentPackage = useMemo(() => getPackageName(step), [step]);
  const currentPrice = useMemo(() => PACKAGE_PRICES[currentPackage], [currentPackage]);
  const packages = useMemo(() => getPackages(), []);
  const materials = useMemo(() => MATERIAL_DETAILS[currentPackage], [currentPackage]);

  const selectPackage = useCallback((packageName: PackageTier) => {
    const targetSteps: Record<PackageTier, number> = { Economy: 0, Standard: 1, Premium: 2 };
    setStep(targetSteps[packageName]);
  }, [setStep]);

  return {
    step,
    setStep,
    currentPackage,
    packages,
    currentPrice,
    previousPrice: previousPriceRef.current,
    materials,
    selectPackage,
  };
}
