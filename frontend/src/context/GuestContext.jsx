import { createContext, useContext, useState } from 'react'

const STORAGE_KEY = 'kiosk_guest'
const GuestContext = createContext(null)

function loadGuest() {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch { return null }
}

export function GuestProvider({ children }) {
  const [guest, setGuest] = useState(loadGuest)

  function login({ bookingId, lastName, displayName, guestEmail, rooms }) {
    const deliveryRoom = rooms?.length === 1 ? rooms[0].roomNumber : null
    const session = { bookingId, lastName, displayName, guestEmail, rooms, deliveryRoom }
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(session))
    setGuest(session)
  }

  function setDeliveryRoom(roomNumber) {
    setGuest(prev => {
      if (!prev) return null
      const updated = { ...prev, deliveryRoom: roomNumber }
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
      return updated
    })
  }

  function logout() {
    sessionStorage.removeItem(STORAGE_KEY)
    setGuest(null)
  }

  return (
    <GuestContext.Provider value={{ guest, login, setDeliveryRoom, logout }}>
      {children}
    </GuestContext.Provider>
  )
}

export function useGuest() {
  return useContext(GuestContext)
}
