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
        quantity: i.quantity,
        notes: i.notes,
      }))
      const result = await placeOrder({
        roomNumber: guest.roomNumber,
        lastName: guest.lastName,
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
      <div
        className="min-h-dvh flex flex-col items-center justify-center px-6"
        style={{ background: 'linear-gradient(135deg, #59A310 0%, #1a3a05 100%)' }}
      >
        <div className="w-16 h-16 rounded-full border-2 border-white/30 flex items-center justify-center mb-5">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8">
            <path d="M2.25 2.25a.75.75 0 0 0 0 1.5h1.386c.17 0 .318.114.362.278l2.558 9.592a3.752 3.752 0 0 0-2.806 3.63c0 .414.336.75.75.75h15.75a.75.75 0 0 0 0-1.5H5.378A2.25 2.25 0 0 1 7.5 15h11.218a.75.75 0 0 0 .674-.421 60.358 60.358 0 0 0 2.96-7.228.75.75 0 0 0-.525-.965A60.864 60.864 0 0 0 5.68 4.509l-.232-.867A1.875 1.875 0 0 0 3.636 2.25H2.25ZM3.75 20.25a1.5 1.5 0 1 1 3 0 1.5 1.5 0 0 1-3 0ZM16.5 20.25a1.5 1.5 0 1 1 3 0 1.5 1.5 0 0 1-3 0Z" />
          </svg>
        </div>
        <p className="text-xs font-semibold text-white/60 tracking-widest uppercase mb-1">Your Order</p>
        <h1 className="text-2xl font-bold text-white text-center mb-1">Cart is Empty</h1>
        <p className="text-sm text-white/60 text-center mb-8">Add items from the menu to get started.</p>
        <button
          onClick={() => navigate('/menu')}
          className="w-full max-w-xs bg-white text-[#59A310] rounded-none font-bold active:opacity-80 transition-opacity"
          style={{ paddingTop: '0.75rem', paddingBottom: '0.75rem', fontSize: '0.875rem' }}
        >
          Back to Menu
        </button>
      </div>
    )
  }

  return (
    <div className="min-h-dvh flex flex-col bg-[#f5f0e8]">

      {/* Header */}
      <div className="sticky top-0 z-10 bg-[#f5f0e8] pb-4" style={{ paddingLeft: '2.5rem', paddingRight: '2.5rem', paddingTop: '2.5rem' }}>
        <div className="flex items-center justify-between mb-3">
          <button
            onClick={() => navigate('/menu')}
            className="text-sm text-[#59A310] font-semibold flex items-center gap-1"
          >
            ← Menu
          </button>
          <button
            onClick={() => { clearCart(); navigate('/menu') }}
            className="bg-red-500 text-white font-bold active:opacity-70 transition-opacity tracking-wide"
            style={{ fontSize: '0.97rem', paddingLeft: '1.7rem', paddingRight: '1.7rem', paddingTop: '0.73rem', paddingBottom: '0.73rem' }}
          >
            Clear Cart
          </button>
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Your Order</h1>
        <p className="text-sm text-gray-500 mt-0.5">Room {guest?.roomNumber} · {guest?.displayName}</p>
      </div>

      <main className="flex-1 pb-40 flex flex-col gap-3" style={{ paddingLeft: '2.5rem', paddingRight: '2.5rem' }}>

        {/* Cart items */}
        {items.map(item => (
          <div key={item.id} className="bg-[#ede8dc] rounded-none p-4 flex flex-col gap-3">

            <div className="flex items-start justify-between">
              <span className="font-semibold text-gray-900">{item.name}</span>
              <span className="font-bold text-gray-900 ml-3 shrink-0">
                ₱{(item.price * item.quantity).toFixed(2)}
              </span>
            </div>

            <div className="flex items-center justify-between">
              {/* Stepper */}
              <div className="flex items-center justify-between bg-[#59A310] rounded-none px-2 py-1.5 w-28">
                <button
                  onClick={() => updateQuantity(item.id, item.quantity - 1)}
                  className="w-8 h-8 rounded-none bg-white/20 text-white flex items-center justify-center text-base font-semibold"
                >
                  −
                </button>
                <span className="font-bold text-white text-sm">{item.quantity}</span>
                <button
                  onClick={() => updateQuantity(item.id, item.quantity + 1)}
                  className="w-8 h-8 rounded-none bg-white/20 text-white flex items-center justify-center text-base font-semibold"
                >
                  +
                </button>
              </div>
              <button
                onClick={() => removeItem(item.id)}
                className="text-xs text-gray-500 underline underline-offset-2"
              >
                Remove
              </button>
            </div>

            <input
              type="text"
              value={item.notes}
              onChange={e => updateNotes(item.id, e.target.value)}
              placeholder="Special requests (e.g. no onions)"
              className="w-full bg-[#f5f0e8] rounded-none px-3 py-2.5 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#59A310]"
            />
          </div>
        ))}

        {/* Order notes */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Order Notes <span className="font-normal normal-case">(optional)</span>
          </label>
          <textarea
            value={orderNotes}
            onChange={e => setOrderNotes(e.target.value)}
            placeholder="Allergy note, delivery instructions..."
            rows={3}
            className="w-full bg-[#ede8dc] rounded-none px-4 py-3 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#59A310] resize-none"
          />
        </div>

        {error && (
          <p className="text-red-600 text-sm">{error}</p>
        )}
      </main>

      {/* Sticky footer */}
      <footer className="fixed bottom-0 left-0 right-0 bg-[#f5f0e8] border-t border-[#ede8dc] pt-4" style={{ paddingLeft: '2.5rem', paddingRight: '2.5rem', paddingBottom: '2.5rem' }}>
        <div className="flex justify-between items-baseline mb-4">
          <span className="text-gray-600 font-medium">Total</span>
          <span className="text-2xl font-bold text-gray-900">₱{total.toFixed(2)}</span>
        </div>
        <p className="text-xs text-gray-400 mb-3 text-center">Charged to Room {guest?.roomNumber}</p>
        <button
          onClick={handlePlaceOrder}
          disabled={loading}
          className="w-full bg-[#59A310] text-white rounded-none text-2xl font-bold disabled:opacity-50 transition-opacity mb-3"
          style={{ paddingTop: '1.8rem', paddingBottom: '1.8rem' }}
        >
          {loading ? 'Placing Order...' : 'Place Order'}
        </button>
      </footer>

    </div>
  )
}
