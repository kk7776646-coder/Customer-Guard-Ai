import React from 'react';
import { ArrowLeft } from 'lucide-react';

export interface BackNavItem {
  page: string;
  scrollY: number;
  searchQuery?: string;
  churnStatusFilter?: 'All' | 'At-Risk' | 'Active' | 'Churned';
  selectedCustomerId?: string;
  analyticsMode?: 'individual' | 'dataset';
}

export const PAGE_DISPLAY_NAMES: Record<string, string> = {
  dashboard: 'Overview',
  prediction: 'Risk Calculator',
  customers: 'Customer List',
  analytics: 'Trends & Insights',
  revenue: 'Revenue & Profitability',
  datasets: 'Customer Data',
  models: 'Prediction Models',
  model: 'Model Performance',
  history: 'Saved Predictions',
  settings: 'Risk Thresholds',
  profile: 'Account Profile',
  auth: 'Sign In'
};

interface BackNavigationProps {
  activePage: string;
  previousPage?: string | null;
  onBack: () => void;
  className?: string;
}

export function BackNavigation({
  activePage,
  previousPage,
  onBack,
  className = ''
}: BackNavigationProps) {
  // User request: Remove back button in every section
  return null;
}
