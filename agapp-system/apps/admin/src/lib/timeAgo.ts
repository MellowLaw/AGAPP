// Shared relative-time formatter. Lifted out of NotificationBell.tsx (was a
// local, unexported function there) so other views — e.g. the "Last Seen"
// framing for stray-animal reports, see Docs/Planning/Plan-StrayPets-Reporting.md —
// can reuse it instead of duplicating the same math.
export function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}
