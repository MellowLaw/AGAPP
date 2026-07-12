// Shared relative-time formatter for the mobile app. Mirrors the logic already
// inlined as `getRelativeTime` in ForumScreen.tsx so other screens — e.g. the
// "Last Seen" framing for stray-animal reports on TrackingDetailScreen, see
// Docs/Planning/Plan-StrayPets-Reporting.md — don't need to re-derive it.
export function getRelativeTime(dateStr: string): string {
  const now = new Date();
  const then = new Date(dateStr);
  const diffMs = now.getTime() - then.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);
  const diffDays = Math.floor(diffHr / 24);

  if (diffDays > 0) return `${diffDays}d ago`;
  if (diffHr > 0) return `${diffHr}h ago`;
  if (diffMin > 0) return `${diffMin}m ago`;
  return 'Just now';
}
