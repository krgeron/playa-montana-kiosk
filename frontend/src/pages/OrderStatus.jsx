import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { io } from 'socket.io-client'
import { fetchOrder } from '../api'

const STEPS = [
  { key: 'pending',   label: 'Order Received', desc: 'Your order is in the queue' },
  { key: 'preparing', label: 'Preparing',       desc: 'The kitchen is working on it' },
  { key: 'ready',     label: 'Ready!',           desc: 'Your order is ready for delivery' },
  { key: 'served',    label: 'Served',           desc: 'Enjoy your meal!' },
]

const STEP_INDEX = Object.fromEntries(STEPS.map((s, i) => [s.key, i]))

function StepIcon({ done, active, index }) {
  if (done) {
    return (
      <div className="w-9 h-9 rounded-full bg-brand-400 flex items-center justify-center">
        <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </div>
    )
  }
  if (active) {
    return (
      <div className="w-9 h-9 rounded-full bg-brand-400 ring-4 ring-brand-100 flex items-center justify-center">
        <span className="text-white font-bold text-sm">{index + 1}</span>
      </div>
    )
  }
  return (
    <div className="w-9 h-9 rounded-full bg-sand border-2 border-sand-dark flex items-center justify-center">
      <span className="text-ink-faint font-bold text-sm">{index + 1}</span>
    </div>
  )
}

export default function OrderStatus() {
  const { orderId } = useParams()
  const navigate = useNavigate()
  const [order, setOrder] = useState(null)
  const [status, setStatus] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchOrder(orderId)
      .then(data => {
        setOrder(data)
        setStatus(data.status)
      })
      .catch(() => setError('Could not load order. Please check with the front desk.'))
      .finally(() => setLoading(false))
  }, [orderId])

  useEffect(() => {
    const socket = io(window.location.origin)

    socket.on('order_updated', ({ orderId: updatedId, status: newStatus }) => {
      if (String(updatedId) === String(orderId)) {
        setStatus(newStatus)
      }
    })

    return () => socket.disconnect()
  }, [orderId])

  if (loading) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-cream">
        <p className="text-ink-muted text-sm">Loading order...</p>
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center px-6 bg-cream gap-4">
        <p className="text-ink-muted text-center">{error || 'Order not found.'}</p>
        <button onClick={() => navigate('/')} className="text-brand-400 underline text-sm">Back to home</button>
      </div>
    )
  }

  if (status === 'cancelled') {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center px-6 bg-cream gap-5">
        <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
          <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
        <div className="text-center">
          <h1 className="font-heading text-2xl font-bold text-ink mb-1">Order Cancelled</h1>
          <p className="text-ink-muted text-sm">Order #{order.id} has been cancelled. No charges were applied.</p>
        </div>
        <button
          onClick={() => navigate('/menu')}
          className="bg-brand-400 text-white rounded-lg font-bold text-sm uppercase tracking-wide px-8 py-3 active:opacity-80"
        >
          Place a New Order
        </button>
      </div>
    )
  }

  const currentStep = STEP_INDEX[status] ?? 0

  return (
    <div className="min-h-dvh flex flex-col bg-cream">

      {/* Header */}
      <header className="bg-gradient-brand px-6 pt-[calc(1.5rem+env(safe-area-inset-top,0px))] pb-6">
        <p className="text-white/70 text-sm mb-1">Order #{order.id}</p>
        <h1 className="font-heading text-2xl font-bold text-white leading-tight">
          {status === 'ready' ? 'Your order is ready!' :
           status === 'served' ? 'Enjoy your meal!' :
           'Tracking your order'}
        </h1>
        {order.delivery_room && (
          <p className="text-white/70 text-sm mt-1">Delivery to Room {order.delivery_room}</p>
        )}
      </header>

      <main className="flex-1 px-6 py-6 flex flex-col gap-6 max-w-sm mx-auto w-full">

        {/* Ready banner */}
        {status === 'ready' && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 flex items-center gap-3">
            <span className="text-2xl" aria-hidden="true">🍽️</span>
            <p className="text-emerald-800 text-sm font-medium">Your food is ready and on its way to your room!</p>
          </div>
        )}

        {/* Progress stepper */}
        <div className="bg-white rounded-xl p-5 shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
          <div className="flex flex-col gap-0">
            {STEPS.map((step, i) => {
              const done = i < currentStep
              const active = i === currentStep
              const isLast = i === STEPS.length - 1
              return (
                <div key={step.key} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <StepIcon done={done} active={active} index={i} />
                    {!isLast && (
                      <div className={`w-0.5 flex-1 my-1 min-h-[1.5rem] ${done ? 'bg-brand-400' : 'bg-sand-dark'}`} />
                    )}
                  </div>
                  <div className={`pb-5 ${isLast ? 'pb-0' : ''}`}>
                    <p className={`font-bold text-sm ${active ? 'text-brand-600' : done ? 'text-ink' : 'text-ink-faint'}`}>
                      {step.label}
                    </p>
                    {active && (
                      <p className="text-ink-muted text-xs mt-0.5">{step.desc}</p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Order summary */}
        <div className="bg-white rounded-xl shadow-[0_1px_4px_rgba(0,0,0,0.06)] overflow-hidden">
          <div className="px-5 py-3 border-b border-sand">
            <p className="text-xs font-bold text-ink-muted uppercase tracking-widest">Your Order</p>
          </div>
          <div className="divide-y divide-sand">
            {order.items?.map(item => (
              <div key={item.id} className="px-5 py-3 flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-ink">{item.quantity}× {item.item_name}</p>
                  {item.item_notes && (
                    <p className="text-xs text-ink-muted mt-0.5">{item.item_notes}</p>
                  )}
                </div>
                <p className="text-sm text-ink-muted tabular-nums">
                  ₱{(item.unit_price * item.quantity).toFixed(2)}
                </p>
              </div>
            ))}
            <div className="px-5 py-3 flex justify-between items-center bg-cream/50">
              <p className="text-sm font-bold text-ink">Total</p>
              <p className="text-sm font-bold text-ink tabular-nums">₱{Number(order.total_amount).toFixed(2)}</p>
            </div>
          </div>
        </div>

        <p className="text-xs text-ink-faint text-center">
          This page updates automatically. No need to refresh.
        </p>

      </main>
    </div>
  )
}
