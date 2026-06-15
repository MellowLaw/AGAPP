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
    default: 'bg-[#f5f5f5] text-[#737373]',
    success: 'bg-[#dcfce7] text-[#16a34a]',
    warning: 'bg-[#fef3c7] text-[#ca8a04]',
    error: 'bg-[#fee2e2] text-[#dc2626]',
    info: 'bg-[#dbeafe] text-[#2563eb]',
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

// Status badge mappings for reports
export const ReportStatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const statusMap: Record<string, { variant: BadgeVariant; label: string }> = {
    pending: { variant: 'warning', label: 'Pending' },
    acknowledged: { variant: 'info', label: 'Acknowledged' },
    in_progress: { variant: 'default', label: 'In Progress' },
    resolved: { variant: 'success', label: 'Resolved' },
    rejected: { variant: 'error', label: 'Rejected' },
  };
  
  const { variant, label } = statusMap[status] || { variant: 'default', label: status };
  return <Badge variant={variant}>{label}</Badge>;
};

// Status badge mappings for service requests
export const ServiceStatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const statusMap: Record<string, { variant: BadgeVariant; label: string }> = {
    pending: { variant: 'warning', label: 'Pending' },
    under_review: { variant: 'info', label: 'Under Review' },
    awaiting_payment: { variant: 'warning', label: 'Awaiting Payment' },
    processing: { variant: 'default', label: 'Processing' },
    ready_for_pickup: { variant: 'info', label: 'Ready for Pickup' },
    completed: { variant: 'success', label: 'Completed' },
    rejected: { variant: 'error', label: 'Rejected' },
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
