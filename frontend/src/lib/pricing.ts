import type { Package, PackageTier, MaterialDetails } from '@/types';

export const MATERIAL_DETAILS: Record<PackageTier, MaterialDetails> = {
  Economy: {
    flooring: 'Laminate',
    cabinets: 'Stock Flat',
    countertop: 'Laminate',
    timeline: '2 Weeks',
  },
  Standard: {
    flooring: 'LVP Premium',
    cabinets: 'Semi-Custom',
    countertop: 'Granite',
    timeline: '3 Weeks',
  },
  Premium: {
    flooring: 'European Oak',
    cabinets: 'Custom Matte',
    countertop: 'Quartz (Veined)',
    timeline: '4 Weeks',
  },
};

export const PACKAGE_FEATURES = {
  Economy: [
    'Stock cabinet installation',
    'Laminate countertops',
    'Basic fixture package',
    'Single-zone lighting',
  ],
  Standard: [
    'Semi-custom cabinetry',
    'Quartz countertops',
    'Premium fixture package',
    'Multi-zone lighting',
    'Soft-close hardware',
  ],
  Premium: [
    'Custom cabinetry',
    'Natural stone countertops',
    'Designer fixture package',
    'Smart lighting system',
    'Premium soft-close hardware',
    'Integrated appliance panels',
    'Custom backsplash',
  ],
} as const;

export const PACKAGE_PRICES: Record<PackageTier, number> = {
  Economy: 28400,
  Standard: 35200,
  Premium: 42500,
};

export function getPackageName(step: number): PackageTier {
  if (step === 0) return 'Economy';
  if (step === 1) return 'Standard';
  return 'Premium';
}

export function getPackages(): Package[] {
  return [
    {
      name: 'Economy',
      price: PACKAGE_PRICES.Economy,
      features: [...PACKAGE_FEATURES.Economy],
      materials: MATERIAL_DETAILS.Economy,
    },
    {
      name: 'Standard',
      price: PACKAGE_PRICES.Standard,
      features: [...PACKAGE_FEATURES.Standard],
      materials: MATERIAL_DETAILS.Standard,
    },
    {
      name: 'Premium',
      price: PACKAGE_PRICES.Premium,
      features: [...PACKAGE_FEATURES.Premium],
      materials: MATERIAL_DETAILS.Premium,
    },
  ];
}

export function formatPrice(price: number): string {
  return `$${price.toLocaleString()}`;
}
