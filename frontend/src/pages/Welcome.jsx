import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGuest } from '../context/GuestContext'
import { validateGuest } from '../api'

export default function Welcome() {
  const [roomNumber, setRoomNumber] = useState('')
  const [lastName, setLastName] = useState('')
  const [mobile, setMobile] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const { login } = useGuest()
  const navigate = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const data = await validateGuest(roomNumber.trim(), lastName.trim())
      login(roomNumber.trim(), lastName.trim(), data.name, mobile.trim())
      navigate('/menu')
    } catch (err) {
      setError(err.message || 'Could not verify your details. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="min-h-dvh flex flex-col items-center justify-center px-6"
      style={{ background: 'linear-gradient(135deg, #59A310 0%, #1a3a05 100%)' }}
    >

      {/* Emblem */}
      <div className="w-16 h-16 rounded-full border-2 border-white/30 flex items-center justify-center mb-5">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8">
          <path d="M3 11l19-9-9 19-2-8-8-2z" />
        </svg>
      </div>

      {/* Title */}
      <p className="text-xs font-semibold text-white/60 tracking-widest uppercase mb-1">Room Dining</p>
      <h1 className="text-2xl font-bold text-white text-center mb-1">Welcome</h1>
      <p className="text-sm text-white/60 text-center mb-8">Enter your room details to start ordering.</p>

      {/* Form */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-full max-w-xs">

        <div>
          <label className="block text-xs font-semibold text-white/70 uppercase tracking-wider mb-2">
            Room Number
          </label>
          <input
            type="text"
            inputMode="numeric"
            value={roomNumber}
            onChange={e => setRoomNumber(e.target.value)}
            placeholder="e.g. 204"
            required
            className="w-full bg-white/15 rounded-none px-3 py-2 text-sm text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white/60"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-white/70 uppercase tracking-wider mb-2">
            Last Name
          </label>
          <input
            type="text"
            value={lastName}
            onChange={e => setLastName(e.target.value)}
            placeholder="e.g. Smith"
            required
            className="w-full bg-white/15 rounded-none px-3 py-2 text-sm text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white/60"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-white/70 uppercase tracking-wider mb-2">
            Mobile Number
          </label>
          <input
            type="tel"
            inputMode="tel"
            value={mobile}
            onChange={e => setMobile(e.target.value)}
            placeholder="e.g. +63 912 345 6789"
            required
            className="w-full bg-white/15 rounded-none px-3 py-2 text-sm text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white/60"
          />
        </div>

        {error && (
          <p className="text-red-300 text-sm">{error}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-white text-[#59A310] rounded-none font-bold mt-1 disabled:opacity-50 transition-opacity active:opacity-80"
          style={{ paddingTop: '0.75rem', paddingBottom: '0.75rem', fontSize: '0.875rem' }}
        >
          {loading ? 'Verifying...' : 'Start Order'}
        </button>

      </form>
    </div>
  )
}
