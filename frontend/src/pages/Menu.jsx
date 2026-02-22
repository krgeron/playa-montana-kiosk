import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGuest } from '../context/GuestContext'
import { useCart } from '../context/CartContext'
import MenuItem from '../components/MenuItem'
import CartButton from '../components/CartButton'
import { fetchMenu } from '../api'

export default function Menu() {
  const { guest, logout } = useGuest()
  const { itemCount, clearCart } = useCart()
  const navigate = useNavigate()
  const [categories, setCategories] = useState([])
  const [activeCategory, setActiveCategory] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [now, setNow] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

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
    <div className="min-h-dvh flex flex-col bg-[#f5f0e8]">

      {/* Sticky header — top bar + category nav */}
      <div className="sticky top-0 z-10">

        {/* Top bar — room info */}
        <div
          className="flex items-center justify-between"
          style={{ background: 'linear-gradient(135deg, #59A310 0%, #1a3a05 100%)', paddingLeft: '1.25rem', paddingRight: '1.25rem', paddingTop: '1rem', paddingBottom: '1rem' }}
        >
          {/* Left — labeled room details */}
          <div className="flex flex-col gap-0.5">
            <div className="flex items-baseline gap-1.5">
              <span className="text-xs text-white/50 uppercase tracking-wide">Room</span>
              <span className="text-lg font-bold text-white">{guest?.roomNumber}</span>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xs text-white/50 uppercase tracking-wide">Last Name</span>
              <span className="text-lg font-bold text-white">{guest?.lastName}</span>
            </div>
            {guest?.mobile && (
              <div className="flex items-baseline gap-1.5">
                <span className="text-xs text-white/50 uppercase tracking-wide">Mobile</span>
                <span className="text-lg font-bold text-white">{guest.mobile}</span>
              </div>
            )}
          </div>

          {/* Right — clock + actions */}
          <div className="flex flex-col items-end gap-2 shrink-0">
            <p className="text-lg font-bold text-white tabular-nums leading-none">
              {now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </p>
            <p className="text-xs text-white/50 leading-none">
              {now.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}
            </p>
            <div className="flex items-center gap-2 mt-1">
              {itemCount > 0 && (
                <>
                  <div className="bg-white/20 text-white font-bold rounded-none flex items-center gap-1.5" style={{ paddingLeft: '0.7rem', paddingRight: '0.7rem', paddingTop: '0.3rem', paddingBottom: '0.3rem', fontSize: '0.8rem' }}>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                      <path d="M2.25 2.25a.75.75 0 0 0 0 1.5h1.386c.17 0 .318.114.362.278l2.558 9.592a3.752 3.752 0 0 0-2.806 3.63c0 .414.336.75.75.75h15.75a.75.75 0 0 0 0-1.5H5.378A2.25 2.25 0 0 1 7.5 15h11.218a.75.75 0 0 0 .674-.421 60.358 60.358 0 0 0 2.96-7.228.75.75 0 0 0-.525-.965A60.864 60.864 0 0 0 5.68 4.509l-.232-.867A1.875 1.875 0 0 0 3.636 2.25H2.25ZM3.75 20.25a1.5 1.5 0 1 1 3 0 1.5 1.5 0 0 1-3 0ZM16.5 20.25a1.5 1.5 0 1 1 3 0 1.5 1.5 0 0 1-3 0Z" />
                    </svg>
                    <span>{itemCount}</span>
                  </div>
                  <button
                    onClick={clearCart}
                    className="bg-red-500 text-white font-semibold rounded-none active:opacity-70 transition-opacity"
                    style={{ paddingLeft: '0.7rem', paddingRight: '0.7rem', paddingTop: '0.3rem', paddingBottom: '0.3rem', fontSize: '0.8rem' }}
                  >
                    Clear
                  </button>
                </>
              )}
              <button
                onClick={() => { logout(); navigate('/') }}
                className="text-white/60 active:opacity-60 transition-opacity"
                title="Back to login"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Category nav — Tailwind UI dark navbar style */}
        <nav style={{ background: '#59A310' }}>
          <div className="flex">
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                style={activeCategory === cat.id
                  ? { paddingTop: '0.75rem', paddingBottom: '0.75rem', fontSize: '0.9rem', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.25), inset 0 -1px 0 rgba(255,255,255,0.15)' }
                  : { paddingTop: '0.75rem', paddingBottom: '0.75rem', fontSize: '0.9rem' }
                }
                className={`flex-1 font-bold focus:outline-none transition-colors text-center border-b-2 ${
                  activeCategory === cat.id
                    ? 'border-blue-500 bg-blue-500 text-white'
                    : 'border-transparent text-white/60 hover:text-white'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </nav>

      </div>

      {/* Menu content */}
      <main className="flex-1" style={{ paddingLeft: '1.25rem', paddingRight: '1.25rem', paddingBottom: '10rem' }}>
        {currentCategory && (
          <div className="pt-4 pb-3">
            <h2 className="text-xl font-bold text-gray-900">{currentCategory.name}</h2>
            <p className="text-xs text-gray-500 mt-0.5">{availableItems.length} items</p>
          </div>
        )}

        {loading && <p className="text-center text-gray-400 mt-12 text-sm">Loading menu...</p>}
        {error && <p className="text-center text-red-500 mt-12 text-sm">{error}</p>}
        {!loading && !error && availableItems.length === 0 && (
          <p className="text-center text-gray-400 mt-12 text-sm">No items in this category.</p>
        )}

        <div className="grid grid-cols-2 gap-3">
          {availableItems.map(item => (
            <MenuItem key={item.id} item={item} />
          ))}
        </div>
      </main>

      <CartButton />
    </div>
  )
}
