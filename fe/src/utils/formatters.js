/**
 * Format date string to locale date
 */
export function formatDate(dateStr) {
  if (!dateStr) return '—';
  try {
    return new Date(dateStr).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  } catch {
    return dateStr;
  }
}

/**
 * Format date string for input[type=date]
 */
export function toInputDate(dateStr) {
  if (!dateStr) return '';
  // If it's already YYYY-MM-DD, return as is
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
  try {
    return new Date(dateStr).toISOString().split('T')[0];
  } catch {
    return dateStr;
  }
}

/**
 * Format percentage display
 */
export function formatPercent(value) {
  if (value == null) return '—';
  return `${value}%`;
}

/**
 * Get color class for allocation percentage
 */
export function getAllocationColor(value) {
  if (value >= 90) return 'high';
  if (value >= 80) return 'medium';
  return 'low';
}

/**
 * Format timestamp
 */
export function formatDateTime(dateStr) {
  if (!dateStr) return '—';
  try {
    return new Date(dateStr).toLocaleString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateStr;
  }
}

/**
 * Truncate text
 */
export function truncate(str, maxLen = 50) {
  if (!str || str.length <= maxLen) return str;
  return str.slice(0, maxLen) + '...';
}
