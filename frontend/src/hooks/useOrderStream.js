import { useState, useEffect, useRef, useCallback } from 'react'
import { io } from 'socket.io-client'

const POLL_INTERVAL = 5000

export default function useOrderStream() {
  const [orders, setOrders] = useState([])
  const [connected, setConnected] = useState(false)
  const [newOrderAlert, setNewOrderAlert] = useState(null)
  const lastFetchTime = useRef(new Date().toISOString())
  const pollTimer = useRef(null)

  const fetchOrders = useCallback(async () => {
    try {
      const res = await fetch('/api/orders')
      const data = await res.json()
      setOrders(data)
      lastFetchTime.current = new Date().toISOString()
    } catch {
      // Network error — will retry on next poll or reconnect
    }
  }, [])

  const startPolling = useCallback(() => {
    if (pollTimer.current) return
    pollTimer.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/orders/new?since=${lastFetchTime.current}`)
        const data = await res.json()
        if (data.length > 0) {
          lastFetchTime.current = new Date().toISOString()
          fetchOrders()
        }
      } catch {
        // Silently retry
      }
    }, POLL_INTERVAL)
  }, [fetchOrders])

  const stopPolling = useCallback(() => {
    if (pollTimer.current) {
      clearInterval(pollTimer.current)
      pollTimer.current = null
    }
  }, [])

  useEffect(() => {
    fetchOrders()

    const socket = io(window.location.origin)

    socket.on('connect', () => {
      setConnected(true)
      stopPolling()
    })

    socket.on('disconnect', () => {
      setConnected(false)
      startPolling()
    })

    socket.on('new_order', ({ order }) => {
      fetchOrders()
      setNewOrderAlert(order.id)
      setTimeout(() => setNewOrderAlert(null), 3000)
    })

    socket.on('order_updated', ({ orderId, status }) => {
      if (status === 'served' || status === 'cancelled') {
        setOrders(prev => prev.filter(o => o.id !== orderId))
      } else {
        setOrders(prev => prev.map(o =>
          o.id === orderId ? { ...o, status } : o
        ))
      }
    })

    return () => {
      socket.disconnect()
      stopPolling()
    }
  }, [])

  const updateStatus = useCallback(async (orderId, status) => {
    try {
      await fetch(`/api/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
    } catch {
      fetchOrders()
    }
  }, [fetchOrders])

  const cancelOrder = useCallback(async (orderId) => {
    try {
      await fetch(`/api/orders/${orderId}/cancel`, { method: 'POST' })
    } catch {
      fetchOrders()
    }
  }, [fetchOrders])

  return { orders, connected, newOrderAlert, updateStatus, cancelOrder }
}
