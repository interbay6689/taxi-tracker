
export function isNetworkError(error: any) {
  const msg = (error?.message || '').toString().toLowerCase();
  // Cover common browser fetch/network failures
  return (
    msg.includes('failed to fetch') ||
    msg.includes('network') ||
    msg.includes('fetch') ||
    msg.includes('offline') ||
    msg.includes('timeout') ||
    msg.includes('cors')
  );
}
