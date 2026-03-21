import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGuest } from '../context/GuestContext'
import { validateGuest } from '../api'

export default function Welcome() {
  const [lastName, setLastName] = useState('')
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const { login } = useGuest()
  const navigate = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const data = await validateGuest(lastName.trim(), pin.trim())
      if (!data.valid) {
        setError('Invalid last name or PIN. Please try again.')
        return
      }
      login({
        bookingId: data.bookingId,
        lastName: lastName.trim(),
        displayName: data.guestName,
        guestEmail: data.guestEmail,
        rooms: data.rooms,
      })
      navigate('/menu')
    } catch (err) {
      setError(err.message || 'Could not verify your details. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center px-6 bg-gradient-brand">

      {/* Emblem */}
      <div className="w-16 h-16 rounded-full border-2 border-white/30 flex items-center justify-center mb-5">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8" aria-hidden="true">
          <path d="M3 11l19-9-9 19-2-8-8-2z" />
        </svg>
      </div>

      {/* Title */}
      <p className="text-[0.6875rem] font-semibold text-white/70 tracking-[0.15em] uppercase mb-1">Room Dining</p>
      <h1 className="font-heading text-[2rem] font-bold text-white text-center mb-1 leading-[1.2]">Welcome</h1>
      <p className="text-[0.875rem] text-white/70 text-center mb-8">Enter your booking details to start ordering.</p>

      {/* Form */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-full max-w-xs">

        <div>
          <label htmlFor="lastName" className="block text-[0.6875rem] font-semibold text-white/80 uppercase tracking-[0.15em] mb-2">
            Last Name
          </label>
          <input
            id="lastName"
            type="text"
            value={lastName}
            onChange={e => setLastName(e.target.value)}
            placeholder="e.g. Santos"
            required
            autoComplete="off"
            className="w-full rounded-lg px-4 py-3.5 text-[0.9375rem] text-white placeholder-white/40 text-center bg-white/12 border-[1.5px] border-white/20 focus:outline-none focus-visible:border-white/50 focus-visible:ring-2 focus-visible:ring-white/20 transition-all"
          />
        </div>

        <div>
          <label htmlFor="pin" className="block text-[0.6875rem] font-semibold text-white/80 uppercase tracking-[0.15em] mb-2">
            4-Digit PIN
          </label>
          <input
            id="pin"
            type="password"
            inputMode="numeric"
            maxLength={4}
            pattern="[0-9]{4}"
            value={pin}
            onChange={e => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
            placeholder="••••"
            required
            autoComplete="off"
            className="w-full rounded-lg px-4 py-3.5 text-[0.9375rem] text-white placeholder-white/40 tracking-[0.3em] text-center bg-white/12 border-[1.5px] border-white/20 focus:outline-none focus-visible:border-white/50 focus-visible:ring-2 focus-visible:ring-white/20 transition-all"
          />
          <p className="text-xs text-white/50 mt-1.5">Provided at check-in</p>
        </div>

        {error && (
          <div className="bg-red-500/20 border border-red-300/30 rounded-lg px-4 py-3 flex items-start gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-red-300 shrink-0 mt-0.5" aria-hidden="true">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
            </svg>
            <p className="text-red-200 text-sm">{error}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={loading || pin.length !== 4}
          className="w-full bg-white text-brand-700 rounded-lg font-bold text-[0.9375rem] uppercase tracking-[0.02em] mt-1 py-3.5 disabled:opacity-50 transition-all active:opacity-80 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40 focus-visible:ring-offset-2 focus-visible:ring-offset-brand-600"
        >
          {loading ? 'Verifying...' : 'Start Order'}
        </button>

      </form>
    </div>
  )
}
