import type { Package } from '@/types';

export const BASE_PRICE = 24500;

export const PACKAGE_FEATURES = {
  Essential: [
    'Stock cabinet installation',
    'Laminate countertops',
    'Basic fixture package',
    'Single-zone lighting',
  ],
  Signature: [
    'Semi-custom cabinetry',
    'Quartz countertops',
    'Premium fixture package',
    'Multi-zone lighting',
    'Soft-close hardware',
  ],
  Luxe: [
    'Custom cabinetry',
    'Natural stone countertops',
    'Designer fixture package',
    'Smart lighting system',
    'Premium soft-close hardware',
    'Integrated appliance panels',
    'Custom backsplash',
  ],
} as const;

export function calculatePrice(sliderValue: number): number {
  const multiplier = 0.5 + (sliderValue / 100) * 1.5;
  return Math.round(BASE_PRICE * multiplier);
}

export function getPackageName(sliderValue: number): 'Essential' | 'Signature' | 'Luxe' {
  if (sliderValue < 33) return 'Essential';
  if (sliderValue < 67) return 'Signature';
  return 'Luxe';
}

export function getPackages(currentPrice: number): Package[] {
  return [
    {
      name: 'Essential',
      price: Math.round(currentPrice * 0.7),
      features: [...PACKAGE_FEATURES.Essential],
      multiplier: 0.7,
    },
    {
      name: 'Signature',
      price: currentPrice,
      features: [...PACKAGE_FEATURES.Signature],
      multiplier: 1.0,
    },
    {
      name: 'Luxe',
      price: Math.round(currentPrice * 1.4),
      features: [...PACKAGE_FEATURES.Luxe],
      multiplier: 1.4,
    },
  ];
}

export function formatPrice(price: number): string {
  return `$${price.toLocaleString()}`;
}
