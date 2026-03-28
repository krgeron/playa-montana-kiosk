import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, act } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import OrderStatus from './OrderStatus'

// ── Mocks ─────────────────────────────────────────────────────────────────────

vi.mock('../api', () => ({
  fetchOrder: vi.fn(),
}))

let socketListeners = {}
const mockSocket = {
  on: vi.fn((event, cb) => { socketListeners[event] = cb }),
  disconnect: vi.fn(),
}
vi.mock('socket.io-client', () => ({
  io: vi.fn(() => mockSocket),
}))

import { fetchOrder } from '../api'

// ── Helpers ───────────────────────────────────────────────────────────────────

const ORDER = {
  id: 42,
  status: 'pending',
  delivery_room: '101',
  guest_name: 'Maria Santos',
  total_amount: 580,
  created_at: '2026-03-25 10:00:00',
  notes: null,
  items: [
    { id: 1, item_name: 'Caesar Salad', quantity: 2, unit_price: 250, item_notes: null },
    { id: 2, item_name: 'Iced Tea',     quantity: 1, unit_price: 80,  item_notes: null },
  ],
}

function renderStatus(orderId = '42') {
  return render(
    <MemoryRouter initialEntries={[`/status/${orderId}`]}>
      <Routes>
        <Route path="/status/:orderId" element={<OrderStatus />} />
        <Route path="/" element={<div>home</div>} />
        <Route path="/menu" element={<div>menu</div>} />
      </Routes>
    </MemoryRouter>
  )
}

beforeEach(() => {
  vi.clearAllMocks()
  socketListeners = {}
})

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('OrderStatus', () => {
  it('shows loading state initially', () => {
    fetchOrder.mockReturnValue(new Promise(() => {})) // never resolves
    renderStatus()
    expect(screen.getByText('Loading order...')).toBeInTheDocument()
  })

  it('shows order details after successful fetch', async () => {
    fetchOrder.mockResolvedValue({ ...ORDER, status: 'pending' })
    renderStatus()

    await waitFor(() => expect(screen.getByText('Order #42')).toBeInTheDocument())
    expect(screen.getByText(/Room 101/)).toBeInTheDocument()
    expect(screen.getByText(/Caesar Salad/)).toBeInTheDocument()
    expect(screen.getByText(/Iced Tea/)).toBeInTheDocument()
    expect(screen.getByText('₱580.00')).toBeInTheDocument()
  })

  it('highlights the current step — pending shows step 1 active', async () => {
    fetchOrder.mockResolvedValue({ ...ORDER, status: 'pending' })
    renderStatus()

    await waitFor(() => screen.getByText('Order Received'))
    // Active step description should be visible
    expect(screen.getByText('Your order is in the queue')).toBeInTheDocument()
  })

  it('highlights the current step — preparing shows step 2 active', async () => {
    fetchOrder.mockResolvedValue({ ...ORDER, status: 'preparing' })
    renderStatus()

    await waitFor(() => screen.getByText('Preparing'))
    expect(screen.getByText('The kitchen is working on it')).toBeInTheDocument()
  })

  it('shows green ready banner when status is ready', async () => {
    fetchOrder.mockResolvedValue({ ...ORDER, status: 'ready' })
    renderStatus()

    await waitFor(() =>
      expect(screen.getByText(/Your food is ready and on its way/)).toBeInTheDocument()
    )
    expect(screen.getByText('Your order is ready!')).toBeInTheDocument()
  })

  it('shows cancellation screen when status is cancelled', async () => {
    fetchOrder.mockResolvedValue({ ...ORDER, status: 'cancelled' })
    renderStatus()

    await waitFor(() =>
      expect(screen.getByText('Order Cancelled')).toBeInTheDocument()
    )
    expect(screen.getByText(/Order #42 has been cancelled/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /New Order/i })).toBeInTheDocument()
  })

  it('shows error state when order is not found', async () => {
    fetchOrder.mockRejectedValue(new Error('Order not found'))
    renderStatus()

    await waitFor(() =>
      expect(screen.getByText(/Could not load order/)).toBeInTheDocument()
    )
  })

  it('updates status in real time via socket order_updated event', async () => {
    fetchOrder.mockResolvedValue({ ...ORDER, status: 'pending' })
    renderStatus()

    await waitFor(() => screen.getByText('Your order is in the queue'))

    // Simulate kitchen marking order as ready
    act(() => {
      socketListeners['order_updated']?.({ orderId: 42, status: 'ready' })
    })

    await waitFor(() =>
      expect(screen.getByText(/Your food is ready and on its way/)).toBeInTheDocument()
    )
  })

  it('ignores socket events for other order IDs', async () => {
    fetchOrder.mockResolvedValue({ ...ORDER, status: 'pending' })
    renderStatus()

    await waitFor(() => screen.getByText('Your order is in the queue'))

    act(() => {
      socketListeners['order_updated']?.({ orderId: 999, status: 'ready' }) // different order
    })

    // Status should still show pending
    expect(screen.getByText('Your order is in the queue')).toBeInTheDocument()
    expect(screen.queryByText(/Your food is ready/)).not.toBeInTheDocument()
  })

  it('shows served state when order is served', async () => {
    fetchOrder.mockResolvedValue({ ...ORDER, status: 'pending' })
    renderStatus()

    await waitFor(() => screen.getByText('Tracking your order'))

    act(() => {
      socketListeners['order_updated']?.({ orderId: 42, status: 'served' })
    })

    await waitFor(() =>
      expect(screen.getAllByText('Enjoy your meal!').length).toBeGreaterThan(0)
    )
  })

  it('disconnects socket on unmount', async () => {
    fetchOrder.mockResolvedValue({ ...ORDER })
    const { unmount } = renderStatus()
    await waitFor(() => screen.getByText('Order #42'))
    unmount()
    expect(mockSocket.disconnect).toHaveBeenCalled()
  })
})
