import { useNavigate } from 'react-router-dom'
import { useCart } from '../context/CartContext'

export default function CartButton() {
  const { itemCount, total } = useCart()
  const navigate = useNavigate()

  if (itemCount === 0) return null

  return (
    <div className="fixed bottom-6 left-5 right-5 z-50 pb-[env(safe-area-inset-bottom,0px)]">
      <button
        onClick={() => navigate('/cart')}
        className="w-full relative flex items-center justify-between bg-accent-400 text-white rounded-[14px] text-[1.125rem] font-bold active:opacity-80 transition-all px-6 py-[18px] shadow-[0_8px_24px_rgba(0,0,0,0.18)] focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-300 focus-visible:ring-offset-2"
      >
        <span>View Order ({itemCount})</span>
        <span className="font-bold text-[1.125rem] tabular-nums">₱{total.toFixed(2)}</span>
      </button>
    </div>
  )
}
