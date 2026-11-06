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
  // Rule 7: Do not render redundant Back button on the root dashboard page
  if (activePage === 'dashboard') {
    return null;
  }

  const destinationLabel = previousPage && PAGE_DISPLAY_NAMES[previousPage]
    ? PAGE_DISPLAY_NAMES[previousPage]
    : 'Dashboard';

  return (
    <div className={`flex items-center justify-start ${className}`}>
      <button
        type="button"
        onClick={onBack}
        aria-label={`Back to ${destinationLabel}`}
        title={`Return to ${destinationLabel} (Alt + Left Arrow)`}
        className="group inline-flex items-center gap-2 h-8 px-3 rounded-lg text-xs font-medium bg-[var(--bg-subtle)] hover:bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-subtle)] transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-indigo-500/25 cursor-pointer select-none shadow-2xs"
      >
        <ArrowLeft className="w-3.5 h-3.5 transition-transform duration-150 group-hover:-translate-x-0.5 text-indigo-500" />
        <span>Back</span>
        {destinationLabel && (
          <span className="text-[11px] text-[var(--text-muted)] group-hover:text-[var(--text-secondary)] transition-colors hidden sm:inline">
            · {destinationLabel}
          </span>
        )}
      </button>
    </div>
  );
}
