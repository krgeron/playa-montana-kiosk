import { useLocation, useNavigate } from 'react-router-dom'
import { useGuest } from '../context/GuestContext'
import { useState, useEffect, useCallback } from 'react'

export default function Confirmation() {
  const { state } = useLocation()
  const { guest, logout } = useGuest()
  const navigate = useNavigate()

  const orderId = state?.orderId
  const total = state?.total

  const [countdown, setCountdown] = useState(30)
  const [paused, setPaused] = useState(false)

  const handleDone = useCallback(() => {
    logout()
    navigate('/')
  }, [logout, navigate])

  function handleNewOrder() {
    navigate('/menu')
  }

  useEffect(() => {
    if (paused || countdown <= 0) return
    const timer = setTimeout(() => setCountdown(c => c - 1), 1000)
    return () => clearTimeout(timer)
  }, [countdown, paused])

  useEffect(() => {
    if (countdown <= 0 && !paused) {
      handleDone()
    }
  }, [countdown, paused, handleDone])

  return (
    <div className="min-h-dvh flex flex-col">

      {/* Top — hero */}
      <div className="flex-1 flex flex-col items-center justify-center px-8 pt-16 pb-8 bg-gradient-brand">
        <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center mb-6">
          <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="font-heading text-[2rem] font-bold text-white text-center leading-[1.2]">Order Placed!</h1>
        <p className="text-white/80 text-center mt-2 text-base">
          We'll have it ready soon, {guest?.displayName}.
        </p>
        {guest?.guestEmail && (
          <p className="text-white/60 text-center mt-1 text-sm">
            A confirmation has been sent to {guest.guestEmail}
          </p>
        )}
      </div>

      {/* Bottom — summary card */}
      <div className="bg-cream px-8 pt-8 pb-[calc(2.5rem+env(safe-area-inset-bottom,0px))]">
        <div className="max-w-sm mx-auto flex flex-col gap-5">

          <div className="bg-white rounded-xl divide-y divide-sand overflow-hidden shadow-[0_2px_8px_rgba(0,0,0,0.08)]">
            {orderId && (
              <div className="flex justify-between items-center px-5 py-4">
                <span className="text-[0.875rem] text-ink-muted">Order</span>
                <span className="text-[0.875rem] font-bold text-ink">#{orderId}</span>
              </div>
            )}
            <div className="flex justify-between items-center px-5 py-4">
              <span className="text-[0.875rem] text-ink-muted">Deliver to</span>
              <span className="text-[0.875rem] font-bold text-ink">Room {guest?.deliveryRoom ?? '—'}</span>
            </div>
            {total !== undefined && (
              <div className="flex justify-between items-center px-5 py-4">
                <span className="text-[0.875rem] text-ink-muted">Charged to booking</span>
                <span className="text-[0.875rem] font-bold text-ink tabular-nums">₱{Number(total).toFixed(2)}</span>
              </div>
            )}
          </div>

          {orderId && (
            <button
              onClick={() => { setPaused(true); navigate(`/status/${orderId}`) }}
              className="w-full bg-emerald-500 text-white rounded-lg font-bold text-[0.9375rem] uppercase tracking-[0.02em] py-3.5 active:opacity-80 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300 focus-visible:ring-offset-2"
            >
              Track My Order
            </button>
          )}

          <div className="flex gap-3">
            <button
              onClick={handleNewOrder}
              className="flex-1 bg-brand-400 text-white rounded-lg font-bold text-[0.9375rem] uppercase tracking-[0.02em] py-3.5 active:opacity-80 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-300 focus-visible:ring-offset-2"
            >
              New Order
            </button>
            <button
              onClick={handleDone}
              className="flex-1 bg-white border-2 border-brand-400 text-brand-400 rounded-lg font-bold text-[0.9375rem] uppercase tracking-[0.02em] py-3.5 active:bg-brand-50 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-300 focus-visible:ring-offset-2"
            >
              Done
            </button>
          </div>

          <p className="text-[0.75rem] text-ink-faint text-center">
            {paused ? (
              'Auto-return paused.'
            ) : (
              <>
                Returning to home in {countdown}s ·{' '}
                <button
                  onClick={() => setPaused(true)}
                  className="underline underline-offset-2 text-brand-400 focus:outline-none focus-visible:ring-1 focus-visible:ring-brand-300 rounded"
                >
                  Stay
                </button>
              </>
            )}
          </p>
        </div>
      </div>

    </div>
  )
}
