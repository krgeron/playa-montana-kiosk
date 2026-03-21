import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGuest } from '../context/GuestContext'
import { useCart } from '../context/CartContext'
import MenuItem from '../components/MenuItem'
import CartButton from '../components/CartButton'
import { fetchMenu } from '../api'

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

export default function Menu() {
  const { guest, logout } = useGuest()
  const { itemCount, clearCart } = useCart()
  const navigate = useNavigate()
  const [categories, setCategories] = useState([])
  const [activeCategory, setActiveCategory] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchMenu()
      .then(data => {
        setCategories(data)
        if (data.length > 0) setActiveCategory(data[0].id)
      })
      .catch(() => setError('Failed to load menu. Please try again.'))
      .finally(() => setLoading(false))
  }, [])

  const currentCategory = categories.find(c => c.id === activeCategory)
  const availableItems = currentCategory?.items?.filter(i => i.available) ?? []

  return (
    <div className="min-h-dvh flex flex-col bg-cream">
      <h1 className="sr-only">Menu</h1>

      {/* Sticky header — top bar + category nav */}
      <div className="sticky top-0 z-10">

        {/* Top bar — guest info */}
        <div className="flex items-center justify-between px-5 py-4 bg-gradient-header" style={{ padding: '16px 20px' }}>
          {/* Left — guest details */}
          <div className="flex flex-col gap-0.5">
            <div className="flex items-baseline gap-1.5">
              <span className="text-[0.6875rem] text-white/60 uppercase tracking-[0.15em] font-semibold">Guest</span>
              <span className="text-lg font-bold text-white">{guest?.displayName}</span>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-[0.6875rem] text-white/60 uppercase tracking-[0.15em] font-semibold">Room</span>
              <span className="text-lg font-bold text-white">{guest?.deliveryRoom ?? '—'}</span>
            </div>
          </div>

          {/* Right — clock + actions */}
          <div className="flex flex-col items-end gap-2 shrink-0">
            <Clock
              timeClass="text-lg font-bold text-white tabular-nums leading-none"
              dateClass="text-xs text-white/60 leading-none"
            />
            <div className="flex items-center gap-2 mt-1">
              {itemCount > 0 && (
                <>
                  <div className="bg-white/20 text-white font-bold rounded-md flex items-center gap-1.5 px-2.5 py-1 text-[0.8rem]">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4" aria-hidden="true">
                      <path d="M2.25 2.25a.75.75 0 0 0 0 1.5h1.386c.17 0 .318.114.362.278l2.558 9.592a3.752 3.752 0 0 0-2.806 3.63c0 .414.336.75.75.75h15.75a.75.75 0 0 0 0-1.5H5.378A2.25 2.25 0 0 1 7.5 15h11.218a.75.75 0 0 0 .674-.421 60.358 60.358 0 0 0 2.96-7.228.75.75 0 0 0-.525-.965A60.864 60.864 0 0 0 5.68 4.509l-.232-.867A1.875 1.875 0 0 0 3.636 2.25H2.25ZM3.75 20.25a1.5 1.5 0 1 1 3 0 1.5 1.5 0 0 1-3 0ZM16.5 20.25a1.5 1.5 0 1 1 3 0 1.5 1.5 0 0 1-3 0Z" />
                    </svg>
                    <span>{itemCount}</span>
                  </div>
                  <button
                    onClick={clearCart}
                    className="bg-error text-white font-semibold rounded-md active:opacity-70 transition-opacity px-2.5 py-1 text-[0.8rem] focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
                  >
                    Clear
                  </button>
                </>
              )}
              <button
                onClick={() => { logout(); navigate('/') }}
                className="text-white/70 active:opacity-60 transition-opacity p-1 rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
                aria-label="Log out and return to login"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5" aria-hidden="true">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Category tabs */}
        <nav aria-label="Menu categories" className="bg-cream border-b border-sand overflow-x-auto no-scrollbar">
          <div className="flex">
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`flex-1 min-h-[44px] py-3 text-[0.875rem] font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-300 focus-visible:ring-inset transition-colors text-center whitespace-nowrap border-b-[3px] ${
                  activeCategory === cat.id
                    ? 'border-brand-400 text-brand-400 font-bold'
                    : 'border-transparent text-ink-muted hover:text-brand-500'
                }`}
                aria-pressed={activeCategory === cat.id}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </nav>

      </div>

      {/* Menu content */}
      <main className="flex-1 p-5 pb-40" style={{ padding: '20px 20px 120px 20px' }}>
        {currentCategory && (
          <div className="pt-5 pb-3">
            <h2 className="font-heading text-[1.5rem] font-bold text-ink leading-[1.3]">
              {currentCategory.name}
            </h2>
            <p className="text-[0.875rem] text-ink-muted mt-0.5">{availableItems.length} items available</p>
          </div>
        )}

        {loading && <p className="text-center text-ink-faint mt-12 text-sm">Loading menu...</p>}
        {error && (
          <div className="max-w-sm mx-auto mt-12 bg-error/10 border border-error/20 rounded-lg px-4 py-4 text-center">
            <p className="text-error text-sm font-medium">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-2 text-sm text-brand-400 font-semibold underline underline-offset-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-300 rounded"
            >
              Retry
            </button>
          </div>
        )}
        {!loading && !error && availableItems.length === 0 && (
          <p className="text-center text-ink-faint mt-12 text-sm">No items in this category.</p>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {availableItems.map(item => (
            <MenuItem key={item.id} item={item} />
          ))}
        </div>
      </main>

      <CartButton />
    </div>
  )
}
