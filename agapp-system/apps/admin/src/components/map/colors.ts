// Matches the ReportStatusBadge / former status-chart palette used across admin.
export const STATUS_COLORS: Record<string, string> = {
  'Submitted': '#ca8a04',
  'Under Review': '#2563eb',
  'In Progress': '#7c3aed',
  'Resolved': '#16a34a',
  'Rejected': '#dc2626',
};

// Matches the mobile MapExplorerScreen category palette so pins look the same
// to citizens and admins.
export const FACILITY_COLORS: Record<string, string> = {
  municipal: '#D9A05B',
  police: '#4A90E2',
  fire: '#D0021B',
  hospital: '#2ECC71',
  other: '#9B59B6',
};
