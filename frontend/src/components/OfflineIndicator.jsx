import { useState, useEffect } from 'react'

export default function OfflineIndicator() {
  const [online, setOnline] = useState(navigator.onLine)

  useEffect(() => {
    const goOnline = () => setOnline(true)
    const goOffline = () => setOnline(false)
    window.addEventListener('online', goOnline)
    window.addEventListener('offline', goOffline)
    return () => {
      window.removeEventListener('online', goOnline)
      window.removeEventListener('offline', goOffline)
    }
  }, [])

  if (online) return null

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-error text-white text-center text-[0.875rem] font-medium py-2 px-4 rounded-b-lg" role="alert">
      You're offline — some features may be unavailable
    </div>
  )
}
