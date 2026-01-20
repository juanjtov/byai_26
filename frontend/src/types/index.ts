export interface Package {
  name: 'Essential' | 'Signature' | 'Luxe';
  price: number;
  features: string[];
  multiplier: number;
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
