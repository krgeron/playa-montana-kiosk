import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, act } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import ReadyDisplay from './ReadyDisplay'

// ── Mocks ─────────────────────────────────────────────────────────────────────

let socketListeners = {}
const mockSocket = {
  on: vi.fn((event, cb) => { socketListeners[event] = cb }),
  disconnect: vi.fn(),
}
vi.mock('socket.io-client', () => ({
  io: vi.fn(() => mockSocket),
}))

global.fetch = vi.fn()

// ── Fixtures ──────────────────────────────────────────────────────────────────

function makeOrder(id, room, overrides = {}) {
  return {
    id,
    status: 'ready',
    delivery_room: room,
    guest_name: 'Maria Santos',
    total_amount: 250,
    created_at: '2026-03-25 10:00:00',
    notes: null,
    items: [
      { id: 1, item_name: 'Caesar Salad', quantity: 1, unit_price: 250, item_notes: null },
    ],
    ...overrides,
  }
}

function renderReady() {
  return render(
    <MemoryRouter>
      <ReadyDisplay />
    </MemoryRouter>
  )
}

beforeEach(() => {
  vi.clearAllMocks()
  socketListeners = {}
})

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('ReadyDisplay', () => {
  it('shows empty state when no ready orders', async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => [],
    })
    renderReady()

    await waitFor(() =>
      expect(screen.getByText('No orders ready for delivery')).toBeInTheDocument()
    )
  })

  it('shows ready orders with room numbers', async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => [makeOrder(1, '101'), makeOrder(2, '205')],
    })
    renderReady()

    await waitFor(() => expect(screen.getByText('Room 101')).toBeInTheDocument())
    expect(screen.getByText('Room 205')).toBeInTheDocument()
  })

  it('only shows orders with ready status from the API response', async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => [
        makeOrder(1, '101', { status: 'ready' }),
        makeOrder(2, '102', { status: 'preparing' }), // should be filtered out
      ],
    })
    renderReady()

    await waitFor(() => expect(screen.getByText('Room 101')).toBeInTheDocument())
    expect(screen.queryByText('Room 102')).not.toBeInTheDocument()
  })

  it('shows order items on each card', async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => [makeOrder(1, '101')],
    })
    renderReady()

    await waitFor(() => expect(screen.getByText('Caesar Salad')).toBeInTheDocument())
  })

  it('shows order notes when present', async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => [makeOrder(1, '101', { notes: 'No spicy food' })],
    })
    renderReady()

    await waitFor(() => expect(screen.getByText('No spicy food')).toBeInTheDocument())
  })

  it('adds order to display when socket emits order_updated with ready status', async () => {
    // Initial load: no ready orders
    global.fetch
      .mockResolvedValueOnce({ ok: true, json: async () => [] })             // GET /api/orders
      .mockResolvedValueOnce({ ok: true, json: async () => makeOrder(5, '303') }) // GET /api/orders/5

    renderReady()
    await waitFor(() => screen.getByText('No orders ready for delivery'))

    act(() => {
      socketListeners['order_updated']?.({ orderId: 5, status: 'ready' })
    })

    await waitFor(() => expect(screen.getByText('Room 303')).toBeInTheDocument())
    expect(screen.queryByText('No orders ready for delivery')).not.toBeInTheDocument()
  })

  it('removes order from display when socket emits served status', async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => [makeOrder(1, '101')],
    })
    renderReady()

    await waitFor(() => expect(screen.getByText('Room 101')).toBeInTheDocument())

    act(() => {
      socketListeners['order_updated']?.({ orderId: 1, status: 'served' })
    })

    await waitFor(() =>
      expect(screen.queryByText('Room 101')).not.toBeInTheDocument()
    )
    expect(screen.getByText('No orders ready for delivery')).toBeInTheDocument()
  })

  it('removes order from display when socket emits cancelled status', async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => [makeOrder(1, '101')],
    })
    renderReady()

    await waitFor(() => expect(screen.getByText('Room 101')).toBeInTheDocument())

    act(() => {
      socketListeners['order_updated']?.({ orderId: 1, status: 'cancelled' })
    })

    await waitFor(() =>
      expect(screen.queryByText('Room 101')).not.toBeInTheDocument()
    )
  })

  it('does not duplicate an order already in the ready list', async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => [makeOrder(1, '101')],
    })
    renderReady()

    await waitFor(() => expect(screen.getByText('Room 101')).toBeInTheDocument())

    // Socket fires ready again for the same order
    act(() => {
      socketListeners['order_updated']?.({ orderId: 1, status: 'ready' })
    })

    // Should still be only one card
    expect(screen.getAllByText('Room 101')).toHaveLength(1)
  })

  it('shows order count in header', async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => [makeOrder(1, '101'), makeOrder(2, '202')],
    })
    renderReady()

    await waitFor(() => screen.getByText('Room 101'))
    expect(screen.getByText('2 orders waiting')).toBeInTheDocument()
  })

  it('shows singular "order" when only one is waiting', async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => [makeOrder(1, '101')],
    })
    renderReady()

    await waitFor(() => screen.getByText('Room 101'))
    expect(screen.getByText('1 order waiting')).toBeInTheDocument()
  })

  it('disconnects socket on unmount', async () => {
    global.fetch.mockResolvedValue({ ok: true, json: async () => [] })
    const { unmount } = renderReady()
    await waitFor(() => screen.getByText('No orders ready for delivery'))
    unmount()
    expect(mockSocket.disconnect).toHaveBeenCalled()
  })
})
