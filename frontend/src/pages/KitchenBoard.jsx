import { useState, useEffect, useRef } from 'react'
import useOrderStream from '../hooks/useOrderStream'
import OrderCard from '../components/OrderCard'

const COLUMNS = [
  { key: 'pending', label: 'Pending', headerBg: 'bg-brand-400', dot: 'bg-brand-400' },
  { key: 'preparing', label: 'Preparing', headerBg: 'bg-amber-400', dot: 'bg-amber-400' },
  { key: 'ready', label: 'Ready for Pickup', headerBg: 'bg-emerald-500', dot: 'bg-emerald-500' },
]

function Clock({ timeClass, dateClass }) {
  const [now, setNow] = useState(new Date())
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])
  return (
    <>
      <p className={timeClass}>
        {now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
      </p>
      <p className={dateClass}>
        {now.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}
      </p>
    </>
  )
}

export default function KitchenBoard() {
  const { orders, connected, newOrderAlert, updateStatus } = useOrderStream()
  const alertAudioRef = useRef(null)

  useEffect(() => {
    let wakeLock = null
    async function requestWakeLock() {
      try {
        if ('wakeLock' in navigator) {
          wakeLock = await navigator.wakeLock.request('screen')
        }
      } catch {
        // Wake Lock not supported or denied
      }
    }
    requestWakeLock()

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') requestWakeLock()
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      wakeLock?.release()
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [])

  useEffect(() => {
    if (newOrderAlert) {
      try {
        if (!alertAudioRef.current) {
          alertAudioRef.current = new Audio('/alert.mp3')
        }
        alertAudioRef.current.currentTime = 0
        alertAudioRef.current.play().catch(() => {})
      } catch {
        // Audio not available
      }
    }
  }, [newOrderAlert])

  const grouped = {
    pending: orders.filter(o => o.status === 'pending'),
    preparing: orders.filter(o => o.status === 'preparing'),
    ready: orders.filter(o => o.status === 'ready'),
  }

  return (
    <div className="min-h-dvh flex flex-col bg-cream">
      <h1 className="sr-only">Kitchen Display</h1>

      {/* Header */}
      <header className="text-white px-6 py-4 flex items-center justify-between bg-gradient-header-dark">
        <div className="flex items-center gap-4">
          <span className="font-heading text-xl font-bold" aria-hidden="true">Kitchen Display</span>
          <div className="flex items-center gap-2">
            <span className={`w-2.5 h-2.5 rounded-full ${connected ? 'bg-emerald-400' : 'bg-red-400'}`} aria-hidden="true" />
            <span className="text-[0.75rem] text-white/70">{connected ? 'Live' : 'Reconnecting...'}</span>
          </div>
        </div>
        <div className="text-right">
          <Clock
            timeClass="text-lg font-bold tabular-nums"
            dateClass="text-[0.75rem] text-white/70"
          />
        </div>
      </header>

      {/* Stats bar */}
      <div className="bg-brand-800 px-6 py-2 flex flex-wrap items-center gap-4 sm:gap-6 text-[0.875rem]">
        {COLUMNS.map(col => (
          <div key={col.key} className="flex items-center gap-2">
            <span className={`w-3 h-3 rounded-md ${col.dot}`} aria-hidden="true" />
            <span className="text-white/70">{col.label}:</span>
            <span className="text-white font-bold">{grouped[col.key].length}</span>
          </div>
        ))}
        <div className="sm:ml-auto text-white/70">
          Total active: <span className="text-white font-bold">{orders.length}</span>
        </div>
      </div>

      {/* Columns */}
      <main className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4 overflow-hidden">
        {COLUMNS.map(col => (
          <div key={col.key} className="flex flex-col min-h-0">
            <div className={`${col.headerBg} text-white text-center py-2 rounded-t-xl font-bold text-[0.875rem] uppercase tracking-[0.05em]`}>
              {col.label} ({grouped[col.key].length})
            </div>
            <div className="flex-1 overflow-y-auto bg-cream-dark rounded-b-xl p-3 flex flex-col gap-3">
              {grouped[col.key].length === 0 ? (
                <p className="text-center text-ink-faint text-[0.875rem] py-8">No orders</p>
              ) : (
                grouped[col.key].map(order => (
                  <OrderCard
                    key={order.id}
                    order={order}
                    onStatusChange={updateStatus}
                    isNew={newOrderAlert === order.id}
                  />
                ))
              )}
            </div>
          </div>
        ))}
      </main>
    </div>
  )
}
