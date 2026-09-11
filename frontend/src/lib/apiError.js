/**
 * Turn an axios error from this API into one line a user can act on.
 *
 * Laravel returns 422 with `{ message, errors: { field: [msg, ...] } }`. Without
 * surfacing that, a rejected save just aborts the handler and the button looks broken:
 * nothing closes, nothing reloads, nothing is said. That silent-failure shape is what
 * this exists to prevent.
 */
export function apiErrorMessage(err, fallback = 'Something went wrong. Please try again.') {
  const res = err?.response;

  // 422 — field validation. Show every failing field, not just the first.
  const fieldErrors = res?.data?.errors;
  if (fieldErrors && typeof fieldErrors === 'object') {
    const messages = Object.values(fieldErrors)
      .flat()
      .filter(Boolean);
    if (messages.length) return messages.join('. ');
  }

  if (res?.data?.message) return res.data.message;

  // No response at all means the request never completed.
  if (!res) return 'Could not reach the server. Check your connection and try again.';

  if (res.status === 403) return 'You do not have permission to do that.';
  if (res.status === 404) return 'That record no longer exists.';
  if (res.status === 429) return 'Too many attempts. Please wait a moment and try again.';

  return fallback;
}
