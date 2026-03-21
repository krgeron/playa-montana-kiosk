import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useGuest } from '../context/GuestContext'
import { validateToken } from '../api'

export default function TokenAuth() {
  const [searchParams] = useSearchParams()
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const { login } = useGuest()
  const navigate = useNavigate()

  useEffect(() => {
    const token = searchParams.get('token')
    if (!token) {
      setError('No token provided. Please use the QR code to access this page.')
      setLoading(false)
      return
    }

    validateToken(token)
      .then(data => {
        if (!data.valid) {
          setError(data.reason || 'Invalid or expired QR code. Please request a new one at the front desk.')
          return
        }
        login({
          bookingId: data.bookingId,
          lastName: data.guestName,
          displayName: data.guestName,
          guestEmail: data.guestEmail,
          rooms: data.rooms,
        })
        navigate('/menu', { replace: true })
      })
      .catch(() => {
        setError('Could not verify your QR code. Please try again or use PIN login.')
      })
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center px-6 bg-gradient-brand">
      <div className="w-16 h-16 rounded-full border-2 border-white/30 flex items-center justify-center mb-5">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8" aria-hidden="true">
          <path d="M3 11l19-9-9 19-2-8-8-2z" />
        </svg>
      </div>

      {loading && (
        <>
          <h1 className="font-heading text-[2rem] font-bold text-white text-center mb-2 leading-[1.2]">Verifying...</h1>
          <p className="text-[0.875rem] text-white/70 text-center">Please wait while we confirm your booking.</p>
        </>
      )}

      {error && (
        <>
          <h1 className="font-heading text-[2rem] font-bold text-white text-center mb-2 leading-[1.2]">Access Error</h1>
          <div className="bg-red-500/20 border border-red-300/30 rounded-lg px-4 py-3 mb-6 max-w-xs">
            <p className="text-sm text-red-200 text-center">{error}</p>
          </div>
          <button
            onClick={() => navigate('/', { replace: true })}
            className="w-full max-w-xs bg-white text-brand-700 rounded-lg font-bold text-[0.9375rem] uppercase tracking-[0.02em] py-3.5 active:opacity-80 transition-opacity focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
          >
            Use PIN Login Instead
          </button>
        </>
      )}
    </div>
  )
}
