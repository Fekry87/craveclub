import i18n from '../i18n';

/**
 * Locale-aware date formatting that follows the active UI language.
 *
 * Arabic is pinned to the Gregorian calendar with Latin digits: `ar-SA` on its
 * own defaults to the Islamic (Hijri) calendar and Arabic-Indic numerals in most
 * browsers, which would make training dates unreadable next to the Gregorian
 * dates stored in the backend.
 */
export function dateLocale(lang = i18n.language) {
  return (lang || 'en').startsWith('ar') ? 'ar-SA-u-ca-gregory-nu-latn' : 'en-US';
}

export function formatDate(value, options = { year: 'numeric', month: 'short', day: 'numeric' }) {
  if (!value) return '';
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString(dateLocale(), options);
}

export function formatDateTime(value, options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) {
  if (!value) return '';
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleString(dateLocale(), options);
}
