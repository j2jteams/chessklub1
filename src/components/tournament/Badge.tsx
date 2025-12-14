'use client';

interface BadgeProps {
  label: string;
  variant?: 'default' | 'new' | 'free' | 'online' | 'inperson' | 'category';
  className?: string;
}

export default function Badge({ label, variant = 'default', className = '' }: BadgeProps) {
  const baseClasses = 'px-2 py-1 text-xs rounded-full font-medium';
  
  const variantClasses = {
    default: 'bg-gray-100 text-gray-700',
    new: 'bg-green-100 text-green-700',
    free: 'bg-orange-100 text-orange-700',
    online: 'bg-violet-100 text-violet-700',
    inperson: 'bg-blue-100 text-blue-700',
    category: 'bg-gray-100 text-gray-700',
  };

  return (
    <span className={`${baseClasses} ${variantClasses[variant]} ${className}`}>
      {label}
    </span>
  );
}

