const router = require('express').Router()

const MENU_APP_URL = (process.env.MENU_APP_URL || 'http://localhost:3002').replace(/\/$/, '')

function toAbsoluteImageUrl(url) {
  if (!url) return null
  if (url.startsWith('http://') || url.startsWith('https://')) return url
  const base = MENU_APP_URL
  return url.startsWith('/') ? `${base}${url}` : `${base}/${url}`
}

router.get('/categories', async (req, res) => {
  const upstreamUrl = `${MENU_APP_URL}/api/v1/kiosk/menu`
  try {
    const response = await fetch(upstreamUrl)
    const json = await response.json()
    if (!response.ok) {
      if (response.status === 404) {
        console.error(
          `[menu] Upstream 404: ${upstreamUrl} — set MENU_APP_URL to menu-management (e.g. http://localhost:3002), not the booking API.`,
        )
        return res.status(404).json({
          ...json,
          kioskHint:
            'GET /api/v1/kiosk/menu was not found on MENU_APP_URL. Use the menu-management service URL (see backend/.env.example).',
        })
      }
      return res.status(response.status).json(json)
    }
    const raw = json.data || []
    const transformed = raw.map((cat) => ({
      ...cat,
      items: (cat.items || []).map((item) => ({
        ...item,
        available: item.isAvailable ?? item.available ?? true,
        imageUrl: toAbsoluteImageUrl(item.imageUrl),
      })),
    }))
    res.json(transformed)
  } catch (err) {
    console.error(`[menu] Fetch failed (${upstreamUrl}):`, err.message)
    res.status(503).json({ error: 'Menu service unavailable' })
  }
})

module.exports = router
