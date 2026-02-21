import { createContext, useContext, useState } from 'react'

const GuestContext = createContext(null)

export function GuestProvider({ children }) {
  const [guest, setGuest] = useState(null)
  // guest shape: { roomNumber, lastName, displayName, mobile }

  function login(roomNumber, lastName, displayName, mobile) {
    setGuest({ roomNumber, lastName, displayName, mobile })
  }

  function logout() {
    setGuest(null)
  }

  return (
    <GuestContext.Provider value={{ guest, login, logout }}>
      {children}
    </GuestContext.Provider>
  )
}

export function useGuest() {
  return useContext(GuestContext)
}
