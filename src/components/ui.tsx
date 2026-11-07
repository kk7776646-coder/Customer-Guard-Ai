import React, { useState, useEffect } from 'react';

export const BRAND_NAME = 'Clario';
export const BRAND_TAGLINE = 'Customer Intelligence, Made Clear.';

export function ClarioLogo({ size = 28, className = '' }: { size?: number; className?: string }) {
  return (
    <span
      className={`inline-flex items-center justify-center shrink-0 select-none ${className}`}
      aria-hidden="true"
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="block shrink-0 drop-shadow-xs"
      >
        <defs>
          <linearGradient id="clario-bg-grad" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#7C3AED" />
            <stop offset="100%" stopColor="#4F46E5" />
          </linearGradient>
          <linearGradient id="clario-arc-grad" x1="8" y1="10" x2="28" y2="30" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="100%" stopColor="#E0E7FF" />
          </linearGradient>
        </defs>
        {/* Logo background container */}
        <rect width="40" height="40" rx="10" fill="url(#clario-bg-grad)" />
        <rect x="0.5" y="0.5" width="39" height="39" rx="9.5" stroke="#FFFFFF" strokeOpacity="0.25" strokeWidth="1" />
        {/* Logo emblem lines & chart bars in high-contrast crisp white and emerald */}
        <path
          d="M25.2 12.2C23.3 10.8 20.9 10 18.3 10C12.6 10 8 14.5 8 20C8 25.5 12.6 30 18.3 30C20.9 30 23.3 29.2 25.2 27.8"
          stroke="url(#clario-arc-grad)"
          strokeWidth="3"
          strokeLinecap="round"
        />
        <rect x="16" y="20.5" width="2.8" height="5.5" rx="1.4" fill="#C7D2FE" />
        <rect x="20.6" y="17" width="2.8" height="9" rx="1.4" fill="#FFFFFF" />
        <rect x="25.2" y="13.5" width="2.8" height="12.5" rx="1.4" fill="#34D399" />
        <circle cx="29.6" cy="11.4" r="2.3" fill="#34D399" />
      </svg>
    </span>
  );
}

export function Card({ variant = 'default', className = '', children, ...props }: any) {
  const variantStyles: Record<string, string> = {
    // Primary card: #FFFFFF in Light Mode, #151515 in Dark Mode
    default: 'bg-[var(--bg-card)] border-[var(--border-subtle)] shadow-xs text-[var(--text-primary)] rounded-[20px]',
    primary: 'bg-[var(--bg-card)] border-[var(--border-subtle)] shadow-xs text-[var(--text-primary)] rounded-[20px]',
    // Secondary card: #FAFAFA in Light Mode, #1B1B1B in Dark Mode
    secondary: 'bg-[var(--bg-card-secondary)] border-[var(--border-subtle)] shadow-2xs text-[var(--text-primary)] rounded-[20px]',
    // Elevated surfaces / modals / toolbars: #FFFFFF in Light Mode, #222222 in Dark Mode
    elevated: 'bg-[var(--bg-elevated)] border-[var(--border-secondary)] shadow-md text-[var(--text-primary)] rounded-[20px]',
    // Subtle highlighted background: #F0F0F0 in Light Mode, #222222 in Dark Mode
    highlight: 'bg-[var(--bg-highlight)] border-[var(--border-highlight)] shadow-xs text-[var(--text-primary)] rounded-[20px]',
    // Important metric cards with subtle thematic hex backgrounds and crisp text:
    indigo: 'bg-[#F5F3FF] dark:bg-[#171324] border-[#DDD6FE] dark:border-[#4C1D95]/40 shadow-xs text-[#0F172A] dark:text-[#F5F5F5] rounded-[20px]',
    'kpi-primary': 'bg-[#F5F3FF] dark:bg-[#171324] border-[#DDD6FE] dark:border-[#4C1D95]/40 shadow-xs text-[#0F172A] dark:text-[#F5F5F5] rounded-[20px]',
    cyan: 'bg-[#ECFEFF] dark:bg-[#0E1C22] border-[#A5F3FC] dark:border-[#164E63]/40 shadow-xs text-[#0F172A] dark:text-[#F5F5F5] rounded-[20px]',
    'kpi-cyan': 'bg-[#ECFEFF] dark:bg-[#0E1C22] border-[#A5F3FC] dark:border-[#164E63]/40 shadow-xs text-[#0F172A] dark:text-[#F5F5F5] rounded-[20px]',
    violet: 'bg-[#F5F3FF] dark:bg-[#171324] border-[#DDD6FE] dark:border-[#4C1D95]/40 shadow-xs text-[#0F172A] dark:text-[#F5F5F5] rounded-[20px]',
    'kpi-violet': 'bg-[#F5F3FF] dark:bg-[#171324] border-[#DDD6FE] dark:border-[#4C1D95]/40 shadow-xs text-[#0F172A] dark:text-[#F5F5F5] rounded-[20px]',
    emerald: 'bg-[#F0FDF4] dark:bg-[#0E1D13] border-[#BBF7D0] dark:border-[#14532D]/40 shadow-xs text-[#0F172A] dark:text-[#F5F5F5] rounded-[20px]',
    amber: 'bg-[#FFFBEB] dark:bg-[#1E1A0F] border-[#FDE68A] dark:border-[#78350F]/40 shadow-xs text-[#0F172A] dark:text-[#F5F5F5] rounded-[20px]',
    rose: 'bg-[#FFF1F2] dark:bg-[#211116] border-[#FECDD3] dark:border-[#881337]/40 shadow-xs text-[#0F172A] dark:text-[#F5F5F5] rounded-[20px]'
  };
  return (
    <div
      className={`rounded-[20px] border transition-all duration-150 ${variantStyles[variant] || variantStyles.default} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export function Button({ variant = 'primary', size = 'md', className = '', children, disabled = false, type = 'button', ...props }: any) {
  const sizeStyles: Record<string, string> = {
    sm: 'h-8 px-3 text-[13px] gap-1.5 rounded-lg font-medium',
    md: 'h-9 px-3.5 text-[13px] gap-2 rounded-lg font-medium',
    lg: 'h-10 px-4 text-[14px] gap-2 rounded-lg font-semibold'
  };
  const variantStyles: Record<string, string> = {
    // Primary button: #7C3AED in Light, #7C3AED / #A78BFA accent, white text
    primary: 'bg-[var(--btn-primary-bg)] hover:bg-[var(--btn-primary-hover)] active:opacity-90 text-[var(--btn-primary-text)] border border-purple-400/25 shadow-xs disabled:opacity-40 disabled:cursor-not-allowed',
    // Secondary button: White/Gray in Light, Charcoal in Dark
    secondary: 'bg-[var(--btn-secondary-bg)] hover:bg-[var(--btn-secondary-hover)] text-[var(--btn-secondary-text)] border border-[var(--btn-secondary-border)] shadow-xs disabled:opacity-40 disabled:cursor-not-allowed',
    // Outline button: transparent with border
    outline: 'bg-transparent hover:bg-[var(--bg-card-secondary)] text-[var(--text-primary)] border border-[var(--border-subtle)] disabled:opacity-40 disabled:cursor-not-allowed',
    // Success actions: subtle green background and readable text in both themes
    success: 'bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 shadow-xs disabled:opacity-40 disabled:cursor-not-allowed',
    // Danger actions: subtle dark red background with clear red text in both themes
    danger: 'bg-rose-500/15 hover:bg-rose-500/25 text-rose-700 dark:text-rose-400 border border-rose-500/30 shadow-xs disabled:opacity-40 disabled:cursor-not-allowed',
    // Subtle action:
    subtle: 'bg-[var(--bg-subtle)] hover:bg-[var(--bg-highlight)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-subtle)] disabled:opacity-40 disabled:cursor-not-allowed'
  };
  return (
    <button
      type={type}
      disabled={disabled}
      className={`inline-flex items-center justify-center transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-purple-500/25 cursor-pointer select-none shrink-0 whitespace-nowrap ${sizeStyles[size] || sizeStyles.md} ${variantStyles[variant] || variantStyles.primary} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export function RiskBadge({ probability, thresholds = { medium: 35, high: 65 }, size = 'sm' }: any) {
  let level = 'Low Risk';
  let badgeClass = 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
  let dotColor = 'bg-emerald-400';
  if (probability >= thresholds.high) {
    level = 'High Risk';
    badgeClass = 'bg-rose-500/10 text-rose-500 border-rose-500/20';
    dotColor = 'bg-rose-500';
  } else if (probability >= thresholds.medium) {
    level = 'Medium Risk';
    badgeClass = 'bg-amber-500/10 text-amber-500 border-amber-500/20';
    dotColor = 'bg-amber-500';
  }
  const sizeClasses = size === 'lg' ? 'px-3 py-1 text-xs font-semibold tracking-tight' : 'px-2.5 py-0.5 text-xs font-medium';
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border tabular-nums whitespace-nowrap ${badgeClass} ${sizeClasses}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${dotColor}`} />
      {level}
    </span>
  );
}

export function ChurnStatusBadge({ status }: { status: string }) {
  let badgeClass = 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
  let dotColor = 'bg-emerald-400';
  let label = status || 'Active';

  if (status === 'At-Risk') {
    badgeClass = 'bg-amber-500/15 text-amber-500 border-amber-500/30';
    dotColor = 'bg-amber-500';
    label = 'At-Risk';
  } else if (status === 'Churned') {
    badgeClass = 'bg-rose-500/10 text-rose-500 border-rose-500/25';
    dotColor = 'bg-rose-500';
    label = 'Churned';
  }

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 text-xs font-medium rounded-full border whitespace-nowrap ${badgeClass}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${dotColor}`} />
      {label}
    </span>
  );
}

export function FinancialStatusBadge({
  status
}: {
  status: 'Profitable' | 'Break-even' | 'Loss-making' | 'Insufficient Data';
}) {
  let badgeClass = 'bg-[var(--bg-subtle)] text-[var(--text-secondary)] border-[var(--border-subtle)]';
  let dotColor = 'bg-zinc-400';

  if (status === 'Profitable') {
    badgeClass = 'bg-emerald-500/10 text-emerald-500 border-emerald-500/25';
    dotColor = 'bg-emerald-400';
  } else if (status === 'Break-even') {
    badgeClass = 'bg-amber-500/10 text-amber-500 border-amber-500/25';
    dotColor = 'bg-amber-400';
  } else if (status === 'Loss-making') {
    badgeClass = 'bg-rose-500/10 text-rose-500 border-rose-500/25';
    dotColor = 'bg-rose-500';
  }

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 text-xs font-medium rounded-full border whitespace-nowrap ${badgeClass}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${dotColor}`} />
      {status}
    </span>
  );
}

export function UserAvatar({ avatarUrl, name = 'Dr. Elena Rostova', size = 32, className = '', showStatusDot = false }: any) {
  const [imgError, setImgError] = useState(false);
  useEffect(() => {
    setImgError(false);
  }, [avatarUrl]);
  const initials = name
    .replace(/^(Dr\.|Mr\.|Ms\.|Mrs\.|Prof\.)\s+/i, '')
    .trim()
    .split(/\s+/)
    .map((p: string, i: number, arr: string[]) => (i === 0 || i === arr.length - 1 ? p[0] : ''))
    .join('')
    .toUpperCase()
    .slice(0, 2);
  return (
    <div
      style={{ width: `${size}px`, height: `${size}px` }}
      className={`relative rounded-full shrink-0 select-none overflow-hidden bg-indigo-600 text-white font-semibold flex items-center justify-center border border-[var(--border-subtle)] shadow-2xs ${size >= 72 ? 'text-xl' : size >= 44 ? 'text-sm' : 'text-[11px]'} ${className}`}
    >
      {avatarUrl && !imgError ? (
        <img
          src={avatarUrl}
          alt={name}
          onError={() => setImgError(true)}
          className="w-full h-full object-cover block"
          referrerPolicy="no-referrer"
        />
      ) : (
        <span className="tracking-tight leading-none">{initials}</span>
      )}
      {showStatusDot && <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-teal-400 ring-2 ring-[var(--bg-card)]" />}
    </div>
  );
}
