import React from 'react';

type BadgeVariant = 'default' | 'success' | 'warning' | 'error' | 'info';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  className = '',
}) => {
  const variants = {
    default: 'bg-surface-alt text-text-primary border border-theme',
    success: 'bg-green-600 text-white',
    warning: 'bg-amber-500 text-black',
    error: 'bg-red-600 text-white',
    info: 'bg-blue-600 text-white',
  };
  
  return (
    <span
      className={`
        inline-flex items-center px-2.5 py-0.5
        text-xs font-medium rounded-full
        ${variants[variant]}
        ${className}
      `}
    >
      {children}
    </span>
  );
};

// Status badge mappings for reports — covers both UI vocabularies in use:
// lgu/reports uses submitted/under_review, personnel pages use pending/acknowledged.
export const ReportStatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const statusMap: Record<string, { variant: BadgeVariant; label: string }> = {
    pending: { variant: 'warning', label: 'Pending' },
    submitted: { variant: 'warning', label: 'Submitted' },
    acknowledged: { variant: 'info', label: 'Acknowledged' },
    under_review: { variant: 'info', label: 'Under Review' },
    in_progress: { variant: 'default', label: 'In Progress' },
    resolved: { variant: 'success', label: 'Resolved' },
    rejected: { variant: 'error', label: 'Rejected' },
  };

  const { variant, label } = statusMap[status] || { variant: 'default', label: status };
  return <Badge variant={variant}>{label}</Badge>;
};

// Status badge mappings for service requests — keys are the literal DB
// `service_requests.status` values (see supabase/schema.sql CHECK constraint).
export const ServiceStatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const statusMap: Record<string, { variant: BadgeVariant; label: string }> = {
    'Submitted': { variant: 'warning', label: 'Submitted' },
    'Under Review': { variant: 'info', label: 'Under Review' },
    'In Progress': { variant: 'default', label: 'In Progress' },
    'Ready for Pickup': { variant: 'info', label: 'Ready for Pickup' },
    'Released': { variant: 'success', label: 'Released' },
    'Rejected': { variant: 'error', label: 'Rejected' },
  };

  const { variant, label } = statusMap[status] || { variant: 'default', label: status };
  return <Badge variant={variant}>{label}</Badge>;
};

// Status badge for forum moderation
export const ForumStatusBadge: React.FC<{ status: 'pending' | 'approved' | 'flagged' | 'rejected' }> = ({ status }) => {
  const statusMap: Record<string, { variant: BadgeVariant; label: string }> = {
    pending: { variant: 'warning', label: 'Awaiting Moderation' },
    approved: { variant: 'success', label: 'Approved' },
    flagged: { variant: 'error', label: 'Flagged by Filter' },
    rejected: { variant: 'error', label: 'Rejected' },
  };
  
  const { variant, label } = statusMap[status] || { variant: 'default', label: status };
  return <Badge variant={variant}>{label}</Badge>;
};
