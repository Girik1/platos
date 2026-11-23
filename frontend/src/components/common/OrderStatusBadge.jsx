import { Clock, CheckCircle2, ChefHat, BellRing, PackageCheck, XCircle } from 'lucide-react';

export default function OrderStatusBadge({ status, className = '' }) {
  const configs = {
    placed: {
      bg: 'bg-amber-50',
      text: 'text-amber-700',
      border: 'border-amber-200',
      label: 'Order Placed',
      icon: Clock,
    },
    accepted: {
      bg: 'bg-blue-50',
      text: 'text-blue-700',
      border: 'border-blue-200',
      label: 'Accepted',
      icon: CheckCircle2,
    },
    preparing: {
      bg: 'bg-orange-50',
      text: 'text-orange-700',
      border: 'border-orange-200',
      label: 'Preparing Food',
      icon: ChefHat,
    },
    ready: {
      bg: 'bg-emerald-50',
      text: 'text-emerald-700',
      border: 'border-emerald-200',
      label: 'Ready for Pickup',
      icon: BellRing,
    },
    picked_up: {
      bg: 'bg-gray-100',
      text: 'text-gray-700',
      border: 'border-gray-200',
      label: 'Picked Up',
      icon: PackageCheck,
    },
    cancelled: {
      bg: 'bg-red-50',
      text: 'text-red-700',
      border: 'border-red-200',
      label: 'Cancelled',
      icon: XCircle,
    },
  };

  const config = configs[status?.toLowerCase()] || configs.placed;
  const Icon = config.icon;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${config.bg} ${config.text} ${config.border} ${className}`}
    >
      <Icon className="w-3.5 h-3.5" />
      {config.label}
    </span>
  );
}