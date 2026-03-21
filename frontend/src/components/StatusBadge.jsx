const STATUS_CONFIG = {
  pending: {
    label: 'Pending',
    bg: 'bg-brand-50',
    text: 'text-brand-600',
    border: 'border-brand-400',
  },
  preparing: {
    label: 'Preparing',
    bg: 'bg-amber-50',
    text: 'text-amber-800',
    border: 'border-amber-400',
  },
  ready: {
    label: 'Ready',
    bg: 'bg-emerald-50',
    text: 'text-emerald-800',
    border: 'border-emerald-500',
  },
  served: {
    label: 'Served',
    bg: 'bg-gray-100',
    text: 'text-gray-500',
    border: 'border-gray-300',
  },
}

export default function StatusBadge({ status }) {
  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.pending

  return (
    <span className={`inline-flex items-center px-3 py-1 text-[0.75rem] font-bold rounded-md uppercase tracking-[0.05em] border ${config.bg} ${config.text} ${config.border}`}>
      {config.label}
    </span>
  )
}
