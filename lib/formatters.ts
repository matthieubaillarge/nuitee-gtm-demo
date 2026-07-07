// Formatting utilities for the Connect Activation Console

/**
 * Format a number as euros with appropriate suffix (K, M)
 * Examples: €3.21M, €450K, €12,500
 */
export function formatEuro(value: number): string {
  if (value >= 1_000_000) {
    const millions = value / 1_000_000;
    return `€${millions.toFixed(millions >= 10 ? 1 : 2)}M`;
  }
  if (value >= 1_000) {
    const thousands = value / 1_000;
    return `€${thousands >= 100 ? Math.round(thousands) : thousands.toFixed(0)}K`;
  }
  return `€${value.toLocaleString('en-US')}`;
}

/**
 * Format a number with thousands separator
 */
export function formatNumber(value: number): string {
  return value.toLocaleString('en-US');
}

/**
 * Format a percentage value
 */
export function formatPercent(value: number): string {
  return `${Math.round(value)}%`;
}

/**
 * Format conversion rate for display
 */
export function formatConversionRate(current: number, previous: number): string {
  if (previous === 0) return '-';
  const rate = (current / previous) * 100;
  return formatPercent(rate);
}
