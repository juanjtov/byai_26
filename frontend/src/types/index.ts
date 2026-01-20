export type PackageTier = 'Economy' | 'Standard' | 'Premium';

export interface MaterialDetails {
  flooring: string;
  cabinets: string;
  countertop: string;
  timeline: string;
}

export interface Package {
  name: PackageTier;
  price: number;
  features: string[];
  materials: MaterialDetails;
}

export interface ChecklistItem {
  label: string;
  completed: boolean;
  warning?: string;
}

export interface ProcessStep {
  number: string;
  title: string;
  description: string;
  icon: React.ReactNode;
}

export interface PainPoint {
  number: string;
  title: string;
  description: string;
}

export interface Benefit {
  title: string;
  description: string;
}
