import { useState, useEffect } from 'react'
import { io } from 'socket.io-client'

function timeAgo(dateStr) {
  const seconds = Math.floor((Date.now() - new Date(dateStr + 'Z').getTime()) / 1000)
  if (seconds < 60) return `${seconds}s ago`
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  return `${Math.floor(minutes / 60)}h ${minutes % 60}m ago`
}

function Clock() {
  const [now, setNow] = useState(new Date())
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(t)
  }, [])
  return (
    <span className="tabular-nums">
      {now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
    </span>
  )
}

function ReadyCard({ order }) {
  return (
    <div className="bg-white rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.08)] overflow-hidden border border-emerald-100">
      {/* Room banner */}
      <div className="bg-emerald-500 px-6 py-4 flex items-center justify-between">
        <div>
          <p className="text-emerald-100 text-xs font-medium uppercase tracking-widest mb-0.5">Deliver to</p>
          <p className="text-white font-heading text-3xl font-bold leading-none">
            {order.delivery_room ? `Room ${order.delivery_room}` : 'Pick-up'}
          </p>
        </div>
        <div className="text-right">
          <p className="text-emerald-100 text-xs">Order #{order.id}</p>
          <p className="text-emerald-200 text-xs mt-0.5">{timeAgo(order.created_at)}</p>
        </div>
      </div>

      {/* Guest name */}
      <div className="px-6 py-3 border-b border-sand">
        <p className="text-ink font-medium text-sm">{order.guest_name}</p>
      </div>

      {/* Items */}
      <div className="px-6 py-3 flex flex-col gap-1">
        {order.items?.map(item => (
          <div key={item.id} className="flex items-start gap-2">
            <span className="text-emerald-600 font-bold text-sm w-5 flex-shrink-0">{item.quantity}×</span>
            <div>
              <p className="text-sm text-ink">{item.item_name}</p>
              {item.item_notes && (
                <p className="text-xs text-amber-600 mt-0.5">{item.item_notes}</p>
              )}
            </div>
          </div>
        ))}
      </div>

      {order.notes && (
        <div className="mx-4 mb-4 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
          <p className="text-xs text-amber-700">{order.notes}</p>
        </div>
      )}
    </div>
  )
}

export default function ReadyDisplay() {
  const [orders, setOrders] = useState([])
  const [connected, setConnected] = useState(false)

  // Initial load + polling refresh
  useEffect(() => {
    async function loadReady() {
      try {
        const res = await fetch('/api/orders')
        const all = await res.json()
        setOrders(all.filter(o => o.status === 'ready'))
      } catch {
        // Silently retry
      }
    }

    loadReady()
    const poll = setInterval(loadReady, 15000)
    return () => clearInterval(poll)
  }, [])

  // Real-time updates
  useEffect(() => {
    const socket = io(window.location.origin)

    socket.on('connect', () => setConnected(true))
    socket.on('disconnect', () => setConnected(false))

    socket.on('new_order', ({ order }) => {
      // New orders are not ready yet — ignore
    })

    socket.on('order_updated', ({ orderId, status }) => {
      if (status === 'ready') {
        // Fetch full order to get items
        fetch(`/api/orders/${orderId}`)
          .then(r => r.json())
          .then(order => {
            setOrders(prev => {
              const exists = prev.some(o => o.id === orderId)
              return exists ? prev : [...prev, order]
            })
          })
          .catch(() => {})
      } else {
        // Order moved away from ready (served/cancelled) — remove
        setOrders(prev => prev.filter(o => o.id !== orderId))
      }
    })

    return () => socket.disconnect()
  }, [])

  // Wake lock — keep screen on
  useEffect(() => {
    let wakeLock = null
    async function requestWakeLock() {
      try {
        if ('wakeLock' in navigator) wakeLock = await navigator.wakeLock.request('screen')
      } catch {}
    }
    requestWakeLock()
    const onVisible = () => { if (document.visibilityState === 'visible') requestWakeLock() }
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      wakeLock?.release()
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [])

  return (
    <div className="min-h-dvh flex flex-col bg-cream">

      {/* Header */}
      <header className="bg-gradient-header-dark text-white px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="font-heading text-xl font-bold">Ready for Delivery</h1>
          <div className="flex items-center gap-2">
            <span className={`w-2.5 h-2.5 rounded-full ${connected ? 'bg-emerald-400' : 'bg-red-400'}`} />
            <span className="text-white/70 text-xs">{connected ? 'Live' : 'Reconnecting...'}</span>
          </div>
        </div>
        <div className="text-right">
          <p className="text-lg font-bold tabular-nums"><Clock /></p>
          <p className="text-white/70 text-xs">{orders.length} order{orders.length !== 1 ? 's' : ''} waiting</p>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 p-4">
        {orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full min-h-[60vh] gap-3">
            <div className="w-16 h-16 rounded-full bg-emerald-50 border-2 border-emerald-200 flex items-center justify-center">
              <svg className="w-8 h-8 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-ink-muted text-sm">No orders ready for delivery</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 max-w-7xl mx-auto">
            {orders.map(order => (
              <ReadyCard key={order.id} order={order} />
            ))}
          </div>
        )}
      </main>

    </div>
  )
}
