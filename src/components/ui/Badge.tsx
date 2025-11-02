import type { ReactNode } from 'react';

interface BadgeProps {
  children: ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
}

export function Badge({ children, variant = 'default' }: BadgeProps) {
  const variantClasses = {
    default: 'bg-gray-100 text-gray-800',
    success: 'bg-green-100 text-green-800',
    warning: 'bg-yellow-100 text-yellow-800',
    danger: 'bg-red-100 text-red-800',
    info: 'bg-blue-100 text-blue-800',
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${variantClasses[variant]}`}>
      {children}
    </span>
  );
}

export function getStatusBadgeVariant(status: string): 'default' | 'success' | 'warning' | 'danger' | 'info' {
  const statusMap: Record<string, 'default' | 'success' | 'warning' | 'danger' | 'info'> = {
    available: 'success',
    reserved: 'warning',
    rented: 'info',
    maintenance: 'danger',
    inactive: 'default',
    checked_out: 'info',
    returned: 'success',
    canceled: 'default',
  };

  return statusMap[status] || 'default';
}
