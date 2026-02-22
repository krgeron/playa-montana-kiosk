import { useLocation, useNavigate } from 'react-router-dom'
import { useGuest } from '../context/GuestContext'
import { useEffect } from 'react'

export default function Confirmation() {
  const { state } = useLocation()
  const { guest, logout } = useGuest()
  const navigate = useNavigate()

  const orderId = state?.orderId
  const total = state?.total

  function handleNewOrder() {
    navigate('/menu')
  }

  function handleDone() {
    logout()
    navigate('/')
  }

  useEffect(() => {

    const timer = setTimeout(() => {
      console.log("5 seconds have passed - execute action here!");
      handleDone();
    }, 5000);

    
  }, [])

  return (
    <div className="min-h-dvh flex flex-col bg-[#59A310]">

      {/* Top — dark green hero */}
      <div className="flex-1 flex flex-col items-center justify-center px-8 pt-16 pb-8">
        <div className="w-16 h-16 rounded-none bg-white/20 flex items-center justify-center mb-6">
          <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-3xl font-bold text-white text-center">Order placed!</h1>
        <p className="text-green-200 text-center mt-2 text-base">
          We'll have it ready soon, {guest?.displayName}.
        </p>
      </div>

      {/* Bottom — white card */}
      <div className="bg-[#f5f0e8] rounded-none px-8 pt-8 pb-10">
        <div className="max-w-sm mx-auto flex flex-col gap-5">

          {/* Summary - commented out for now */}
          {/* <div className="bg-[#ede8dc] rounded-none divide-y divide-[#d9d3c7]">
            {orderId && (
              <div className="flex justify-between items-center px-4 py-3.5">
                <span className="text-sm text-gray-500">Order</span>
                <span className="text-sm font-bold text-gray-900">#{orderId}</span>
              </div>
            )}
            <div className="flex justify-between items-center px-4 py-3.5">
              <span className="text-sm text-gray-500">Room</span>
              <span className="text-sm font-bold text-gray-900">{guest?.roomNumber}</span>
            </div>
            {total !== undefined && (
              <div className="flex justify-between items-center px-4 py-3.5">
                <span className="text-sm text-gray-500">Charged to room</span>
                <span className="text-sm font-bold text-gray-900">₱{Number(total).toFixed(2)}</span>
              </div>
            )}
          </div> */}
        </div>
      </div>

    </div>
  )
}
