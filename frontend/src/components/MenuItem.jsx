import { useCart } from '../context/CartContext'

export default function MenuItem({ item }) {
  const { items, addItem, updateQuantity } = useCart()
  const cartItem = items.find(i => i.id === item.id)
  const qty = cartItem?.quantity ?? 0

  return (
    <div className="bg-[#ede8dc] rounded-none overflow-hidden flex flex-col">

      {/* Name */}
      <div className="px-4 pt-4 pb-2">
        <h3 className="font-semibold text-gray-900 text-sm leading-snug">{item.name}</h3>
      </div>

      {/* Image — fixed height so emoji is always centered and visible */}
      <div className="h-28 bg-[#d9d3c7] flex items-center justify-center mx-4">
        <span className="text-5xl select-none">{item.emoji ?? '🍽️'}</span>
      </div>

      {/* Price + action */}
      <div className="px-4 pt-2.5 pb-4 flex flex-col gap-2">
        <p className="font-bold text-gray-900 text-sm">₱{Number(item.price).toFixed(2)}</p>

        {qty === 0 ? (
          <button
            onClick={() => addItem(item)}
            className="w-full bg-[#59A310] text-white rounded-none font-semibold transition-opacity active:opacity-80"
            style={{ paddingTop: '0.688rem', paddingBottom: '0.688rem', fontSize: '0.963rem' }}
          >
            Add
          </button>
        ) : (
          <div className="flex items-center justify-between bg-[#59A310] rounded-none px-2" style={{ paddingTop: '0.688rem', paddingBottom: '0.688rem' }}>
            <button
              onClick={() => updateQuantity(item.id, qty - 1)}
              className="w-8 h-8 rounded-none bg-white/20 text-white flex items-center justify-center text-base font-semibold"
            >
              −
            </button>
            <span className="font-bold text-white text-sm">{qty}</span>
            <button
              onClick={() => updateQuantity(item.id, qty + 1)}
              className="w-8 h-8 rounded-none bg-white/20 text-white flex items-center justify-center text-base font-semibold"
            >
              +
            </button>
          </div>
        )}
      </div>

    </div>
  )
}
