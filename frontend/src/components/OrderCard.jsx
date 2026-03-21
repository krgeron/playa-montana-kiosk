import { useState } from 'react'
import StatusBadge from './StatusBadge'

const NEXT_STATUS = {
  pending: 'preparing',
  preparing: 'ready',
  ready: 'served',
}

const ACTION_LABELS = {
  pending: 'Start Preparing',
  preparing: 'Mark Ready',
  ready: 'Mark Served',
}

const STATUS_BORDER = {
  pending: 'border-l-brand-400',
  preparing: 'border-l-amber-400',
  ready: 'border-l-emerald-500',
}

const ACTION_BG = {
  pending: 'bg-brand-400 active:bg-brand-500',
  preparing: 'bg-emerald-600 active:bg-emerald-700',
  ready: 'bg-gray-600 active:bg-gray-700',
}

function timeAgo(dateStr) {
  const seconds = Math.floor((Date.now() - new Date(dateStr + 'Z').getTime()) / 1000)
  if (seconds < 60) return `${seconds}s ago`
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  return `${Math.floor(minutes / 60)}h ${minutes % 60}m ago`
}

export default function OrderCard({ order, onStatusChange, isNew }) {
  const [updating, setUpdating] = useState(false)
  const nextStatus = NEXT_STATUS[order.status]

  async function handleAdvance() {
    if (!nextStatus || updating) return
    setUpdating(true)
    await onStatusChange(order.id, nextStatus)
    setUpdating(false)
  }

  return (
    <div className={`bg-white rounded-xl border-l-4 p-4 flex flex-col gap-3 transition-all shadow-[0_1px_3px_rgba(0,0,0,0.06)] ${
      STATUS_BORDER[order.status] ?? 'border-l-gray-300'
    } ${isNew ? 'ring-2 ring-amber-400 animate-pulse' : ''}`}
    >

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <span className="text-lg font-bold text-ink">#{order.id}</span>
          <span className="text-[0.875rem] text-ink-muted ml-2">{timeAgo(order.created_at)}</span>
        </div>
        <StatusBadge status={order.status} />
      </div>

      {/* Guest + Room */}
      <div className="flex items-center gap-3 text-[0.875rem]">
        <span className="font-medium text-ink">{order.guest_name}</span>
        {order.delivery_room && (
          <span className="bg-cream-dark text-ink-muted px-2 py-0.5 rounded-md text-[0.75rem] font-medium">
            Room {order.delivery_room}
          </span>
        )}
      </div>

      {/* Items */}
      <div className="border-t border-sand pt-2">
        {order.items?.map(item => (
          <div key={item.id} className="flex justify-between items-start py-1">
            <div className="flex-1">
              <span className="text-[0.875rem] font-medium text-ink">
                {item.quantity}x {item.item_name}
              </span>
              {item.item_notes && (
                <p className="text-[0.75rem] text-amber-600 mt-0.5">{item.item_notes}</p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Order notes */}
      {order.notes && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
          <p className="text-[0.75rem] text-amber-700">{order.notes}</p>
        </div>
      )}

      {/* Action */}
      {nextStatus && (
        <button
          onClick={handleAdvance}
          disabled={updating}
          className={`w-full font-bold text-white rounded-lg py-3 text-[0.875rem] uppercase tracking-[0.02em] transition-all active:scale-[0.98] disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${
            ACTION_BG[order.status] ?? 'bg-gray-600'
          }`}
        >
          {updating ? 'Updating...' : ACTION_LABELS[order.status]}
        </button>
      )}
    </div>
  )
}
