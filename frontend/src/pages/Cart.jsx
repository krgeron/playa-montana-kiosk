import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGuest } from '../context/GuestContext'
import { useCart } from '../context/CartContext'
import { placeOrder } from '../api'

export default function Cart() {
  const { guest } = useGuest()
  const { items, total, itemCount, updateQuantity, removeItem, updateNotes, clearCart } = useCart()
  const [orderNotes, setOrderNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  async function handlePlaceOrder() {
    setError('')
    setLoading(true)
    try {
      const orderItems = items.map(i => ({
        menuItemId: i.id,
        itemName: i.name,
        unitPrice: i.price,
        quantity: i.quantity,
        notes: i.notes,
      }))
      const result = await placeOrder({
        bookingId: guest.bookingId,
        guestName: guest.displayName,
        guestEmail: guest.guestEmail,
        deliveryRoom: guest.deliveryRoom,
        items: orderItems,
        notes: orderNotes,
      })
      clearCart()
      navigate('/confirmation', { state: { orderId: result.orderId, total: result.total } })
    } catch (err) {
      setError(err.message || 'Failed to place order. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (itemCount === 0) {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center px-6 bg-gradient-brand">
        <div className="w-16 h-16 rounded-full border-2 border-white/30 flex items-center justify-center mb-5">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8" aria-hidden="true">
            <path d="M2.25 2.25a.75.75 0 0 0 0 1.5h1.386c.17 0 .318.114.362.278l2.558 9.592a3.752 3.752 0 0 0-2.806 3.63c0 .414.336.75.75.75h15.75a.75.75 0 0 0 0-1.5H5.378A2.25 2.25 0 0 1 7.5 15h11.218a.75.75 0 0 0 .674-.421 60.358 60.358 0 0 0 2.96-7.228.75.75 0 0 0-.525-.965A60.864 60.864 0 0 0 5.68 4.509l-.232-.867A1.875 1.875 0 0 0 3.636 2.25H2.25ZM3.75 20.25a1.5 1.5 0 1 1 3 0 1.5 1.5 0 0 1-3 0ZM16.5 20.25a1.5 1.5 0 1 1 3 0 1.5 1.5 0 0 1-3 0Z" />
          </svg>
        </div>
        <p className="text-[0.6875rem] font-semibold text-white/70 tracking-[0.15em] uppercase mb-1">Your Order</p>
        <h1 className="font-heading text-[2rem] font-bold text-white text-center mb-1 leading-[1.2]">Cart is Empty</h1>
        <p className="text-[0.875rem] text-white/70 text-center mb-8">Add items from the menu to get started.</p>
        <button
          onClick={() => navigate('/menu')}
          className="w-full max-w-xs bg-white text-brand-700 rounded-lg font-bold text-[0.9375rem] uppercase tracking-[0.02em] py-3.5 active:opacity-80 transition-opacity focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
        >
          Back to Menu
        </button>
      </div>
    )
  }

  return (
    <div className="min-h-dvh flex flex-col bg-cream">

      {/* Header */}
      <div className="sticky top-0 z-10 bg-cream pb-4 px-5 pt-6">
        <div className="flex items-center justify-between mb-3">
          <button
            onClick={() => navigate('/menu')}
            className="text-[0.875rem] text-brand-400 font-semibold flex items-center gap-1 py-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-300 rounded"
          >
            ← Menu
          </button>
          <button
            onClick={() => { clearCart(); navigate('/menu') }}
            className="bg-error text-white font-bold rounded-lg active:opacity-70 transition-opacity tracking-wide text-[0.875rem] px-5 py-2.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-error/40"
          >
            Clear Cart
          </button>
        </div>
        <h1 className="font-heading text-[1.5rem] font-bold text-ink leading-[1.3]">Review & Place Order</h1>
        <p className="text-[0.875rem] text-ink-muted mt-0.5">{guest?.displayName} · Room {guest?.deliveryRoom ?? '—'}</p>
      </div>

      <main className="flex-1 pb-52 flex flex-col gap-3 px-5">

        {/* Cart items */}
        {items.map(item => (
          <div key={item.id} className="bg-white rounded-[10px] p-4 flex flex-col gap-3 border border-sand shadow-[0_1px_3px_rgba(0,0,0,0.06)]">

            <div className="flex items-start justify-between">
              <span className="font-heading font-semibold text-ink">{item.name}</span>
              <span className="font-bold text-ink ml-3 shrink-0 tabular-nums">
                ₱{(item.price * item.quantity).toFixed(2)}
              </span>
            </div>

            <div className="flex items-center justify-between">
              {/* Quantity stepper */}
              <div className="inline-flex items-center bg-cream-dark border-[1.5px] border-sand rounded-lg overflow-hidden">
                <button
                  onClick={() => updateQuantity(item.id, item.quantity - 1)}
                  aria-label={`Decrease quantity of ${item.name}`}
                  className="w-11 h-11 flex items-center justify-center text-[1.125rem] font-semibold text-brand-400 active:bg-brand-50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-300 focus-visible:ring-inset"
                >
                  −
                </button>
                <span className="min-w-[40px] text-center font-bold text-[0.9375rem] text-ink tabular-nums" aria-live="polite">{item.quantity}</span>
                <button
                  onClick={() => updateQuantity(item.id, item.quantity + 1)}
                  aria-label={`Increase quantity of ${item.name}`}
                  className="w-11 h-11 flex items-center justify-center text-[1.125rem] font-semibold text-brand-400 active:bg-brand-50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-300 focus-visible:ring-inset"
                >
                  +
                </button>
              </div>
              <button
                onClick={() => removeItem(item.id)}
                className="text-[0.75rem] text-ink-muted underline underline-offset-2 py-2 px-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-300 rounded"
              >
                Remove
              </button>
            </div>

            <div>
              <label htmlFor={`notes-${item.id}`} className="sr-only">Special requests for {item.name}</label>
              <input
                id={`notes-${item.id}`}
                type="text"
                value={item.notes}
                onChange={e => updateNotes(item.id, e.target.value)}
                placeholder="Special requests (e.g. no onions)"
                className="w-full bg-cream-dark border-[1.5px] border-sand rounded-lg px-4 py-3 text-[0.9375rem] text-ink placeholder-ink-faint focus:outline-none focus-visible:border-brand-400 focus-visible:ring-2 focus-visible:ring-brand-50 transition-colors"
              />
            </div>
          </div>
        ))}

        {/* Order notes */}
        <div className="flex flex-col gap-2">
          <label htmlFor="orderNotes" className="text-[0.6875rem] font-semibold text-brand-400 uppercase tracking-[0.15em]">
            Order Notes <span className="font-normal normal-case text-ink-muted">(optional)</span>
          </label>
          <textarea
            id="orderNotes"
            value={orderNotes}
            onChange={e => setOrderNotes(e.target.value)}
            placeholder="Allergy note, delivery instructions..."
            rows={3}
            className="w-full bg-cream-dark border-[1.5px] border-sand rounded-lg px-4 py-3 text-[0.9375rem] text-ink placeholder-ink-faint focus:outline-none focus-visible:border-brand-400 focus-visible:ring-2 focus-visible:ring-brand-50 resize-none transition-colors"
          />
        </div>

        {error && (
          <div className="bg-error/10 border border-error/20 rounded-lg px-4 py-3 flex items-start gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-error shrink-0 mt-0.5" aria-hidden="true">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
            </svg>
            <p className="text-error text-sm">{error}</p>
          </div>
        )}
      </main>

      {/* Fixed footer */}
      <footer className="fixed bottom-0 left-0 right-0 bg-cream border-t border-sand pt-4 px-5 pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))]">
        <div className="flex justify-between items-baseline mb-4">
          <span className="text-ink-muted font-medium">Total</span>
          <span className="text-[1.5rem] font-bold text-ink tabular-nums">₱{total.toFixed(2)}</span>
        </div>
        <p className="text-[0.75rem] text-ink-faint mb-3 text-center">Charged to your booking · Room {guest?.deliveryRoom ?? '—'}</p>
        <button
          onClick={handlePlaceOrder}
          disabled={loading}
          className="w-full bg-accent-400 text-white rounded-[10px] text-[1.25rem] font-bold uppercase tracking-[0.02em] py-5 disabled:opacity-50 transition-all active:scale-[0.98] shadow-[0_4px_12px_rgba(0,0,0,0.15)] focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-300 focus-visible:ring-offset-2"
        >
          {loading ? 'Placing Order...' : 'Place Order'}
        </button>
      </footer>

    </div>
  )
}
