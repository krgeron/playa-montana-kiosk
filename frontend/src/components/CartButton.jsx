import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCart } from '../context/CartContext'

export default function CartButton() {
  const { itemCount, total } = useCart()
  const navigate = useNavigate()
  const [showConfirm, setShowConfirm] = useState(false)

  if (itemCount === 0) return null

  return (
    <>
      <div className="fixed bottom-6 left-0 right-0 px-5 z-50">
        <button
          onClick={() => setShowConfirm(true)}
          className="w-full relative flex items-center justify-start bg-[#59A310] text-white rounded-none text-2xl font-bold shadow-xl active:opacity-80 transition-opacity"
          style={{ paddingTop: '1.8rem', paddingBottom: '1.8rem', paddingLeft: '1.25rem', paddingRight: '1.25rem' }}
        >
          <span>View Order</span>
          <span className="absolute right-5 font-bold text-2xl">₱{total.toFixed(2)}</span>
        </button>
      </div>

      {/* Confirmation modal — Tailwind UI "Simple with gray footer" style */}
      {showConfirm && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.5)' }}
          onClick={() => setShowConfirm(false)}
        >
          <div
            className="w-full max-w-sm bg-white overflow-hidden shadow-xl"
            onClick={e => e.stopPropagation()}
          >
            {/* Body */}
            <div className="bg-white px-6 pt-6 pb-5 flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#59A310]/10">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#59A310" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                  <path d="M2.25 2.25a.75.75 0 0 0 0 1.5h1.386c.17 0 .318.114.362.278l2.558 9.592a3.752 3.752 0 0 0-2.806 3.63c0 .414.336.75.75.75h15.75a.75.75 0 0 0 0-1.5H5.378A2.25 2.25 0 0 1 7.5 15h11.218a.75.75 0 0 0 .674-.421 60.358 60.358 0 0 0 2.96-7.228.75.75 0 0 0-.525-.965A60.864 60.864 0 0 0 5.68 4.509l-.232-.867A1.875 1.875 0 0 0 3.636 2.25H2.25ZM3.75 20.25a1.5 1.5 0 1 1 3 0 1.5 1.5 0 0 1-3 0ZM16.5 20.25a1.5 1.5 0 1 1 3 0 1.5 1.5 0 0 1-3 0Z" />
                </svg>
              </div>
              <div>
                <h3 className="text-base font-semibold text-gray-900">Confirm Order</h3>
                <p className="mt-1 text-sm text-gray-500">Are you sure with this order? You'll be able to review items before placing.</p>
              </div>
            </div>

            {/* Gray footer */}
            <div className="bg-gray-50 px-6 py-4 flex flex-row-reverse gap-3">
              <button
                onClick={() => { setShowConfirm(false); navigate('/cart') }}
                className="inline-flex justify-center bg-[#59A310] text-white font-semibold text-sm shadow-sm px-4 py-2"
              >
                View Order
              </button>
              <button
                onClick={() => setShowConfirm(false)}
                className="inline-flex justify-center bg-white text-gray-900 font-semibold text-sm shadow-sm ring-1 ring-inset ring-gray-300 px-4 py-2"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
