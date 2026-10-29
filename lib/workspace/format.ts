/** Human-readable storage sizes: 0 B, 340 B, 12.5 KB, 3.2 MB (1 KB = 1,024 bytes, as file managers show it). */
export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const exponent = Math.min(Math.floor(Math.log2(bytes) / 10), units.length - 1);
  const value = bytes / 1024 ** exponent;
  const shown = exponent === 0 || value >= 100 ? Math.round(value) : Math.round(value * 10) / 10; // 50 MB, 12.5 KB
  return `${shown} ${units[exponent]}`;
}

/** Share of the quota used, 0 to 100 (a tiny non-zero use still shows as at least 1). */
export function usagePercent(bytes: number, quotaBytes: number): number {
  if (quotaBytes <= 0) return 0;
  const pct = (bytes / quotaBytes) * 100;
  return pct > 0 && pct < 1 ? 1 : Math.min(100, Math.round(pct));
}
