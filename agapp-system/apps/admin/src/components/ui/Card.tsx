import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  noBorder?: boolean;
  padding?: 'sm' | 'md' | 'lg' | 'none';
  onClick?: () => void;
}

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  noBorder = false,
  padding = 'md',
  onClick,
}) => {
  const paddings = {
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
    none: '',
  };
  
  return (
    <div
      onClick={onClick}
      className={`
        bg-white rounded-lg
        ${noBorder ? '' : 'border border-[#e5e5e5]'}
        ${paddings[padding]}
        ${onClick ? 'cursor-pointer' : ''}
        ${className}
      `}
    >
      {children}
    </div>
  );
};

interface CardHeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}

export const CardHeader: React.FC<CardHeaderProps> = ({ title, subtitle, action }) => (
  <div className="flex items-start justify-between mb-4">
    <div>
      <h3 className="text-lg font-semibold text-[#1a1a1a]">{title}</h3>
      {subtitle && <p className="text-sm text-[#737373] mt-1">{subtitle}</p>}
    </div>
    {action && <div>{action}</div>}
  </div>
);
