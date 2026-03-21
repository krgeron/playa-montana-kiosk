import { memo } from 'react'
import { useCart } from '../context/CartContext'

export default memo(function MenuItem({ item }) {
  const { items, addItem, updateQuantity } = useCart()
  const cartItem = items.find(i => i.id === item.id)
  const qty = cartItem?.quantity ?? 0

  return (
    <div className="bg-white rounded-xl overflow-hidden flex flex-col shadow-[0_1px_3px_rgba(0,0,0,0.06)]">

      {/* Image */}
      <div className="aspect-[4/3] bg-cream-dark flex items-center justify-center overflow-hidden">
        {item.imageUrl ? (
          <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
        ) : (
          <span className="text-3xl select-none" role="img" aria-label={item.name}>{item.emoji ?? '🍽️'}</span>
        )}
      </div>

      {/* Content */}
      <div className="p-2.5 flex flex-col gap-1.5">
        <h3 className="font-heading font-semibold text-ink text-[0.8125rem] leading-snug line-clamp-2">{item.name}</h3>
        <p className="font-bold text-ink text-[0.8125rem] tabular-nums">₱{Number(item.price).toFixed(2)}</p>

        {qty === 0 ? (
          <button
            onClick={() => addItem(item)}
            className="w-full min-h-[52px] bg-brand-400 text-white rounded-xl font-bold text-base uppercase tracking-[0.02em] py-4 transition-all active:bg-brand-500 active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-300 focus-visible:ring-offset-2"
          >
            Add
          </button>
        ) : (
          <div className="inline-flex items-stretch min-h-[52px] bg-cream-dark border-[1.5px] border-sand rounded-xl overflow-hidden self-stretch">
            <button
              onClick={() => updateQuantity(item.id, qty - 1)}
              aria-label={`Decrease quantity of ${item.name}`}
              className="min-w-[52px] min-h-[52px] flex items-center justify-center text-xl font-semibold text-brand-400 active:bg-brand-50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-300 focus-visible:ring-inset"
            >
              −
            </button>
            <span className="flex-1 flex items-center justify-center font-bold text-base text-ink tabular-nums">{qty}</span>
            <button
              onClick={() => updateQuantity(item.id, qty + 1)}
              aria-label={`Increase quantity of ${item.name}`}
              className="min-w-[52px] min-h-[52px] flex items-center justify-center text-xl font-semibold text-brand-400 active:bg-brand-50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-300 focus-visible:ring-inset"
            >
              +
            </button>
          </div>
        )}
      </div>

    </div>
  )
})
