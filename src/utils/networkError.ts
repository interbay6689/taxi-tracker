
export function isNetworkError(error: any) {
  const msg = (error?.message || '').toString().toLowerCase();
  return msg.includes('failed to fetch') || msg.includes('network') || msg.includes('fetch');
}
