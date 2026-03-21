const nodemailer = require('nodemailer')

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'localhost',
  port: Number(process.env.SMTP_PORT || 587),
  secure: process.env.SMTP_SECURE === 'true',
  auth: process.env.SMTP_USER ? {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  } : undefined,
})

async function sendOrderConfirmation(order, items) {
  if (!order.guest_email) return

  const itemLines = items
    .map(i => `  ${i.quantity}x ${i.item_name} — ₱${(i.unit_price * i.quantity).toFixed(2)}`)
    .join('\n')

  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM || 'orders@playamontana.com',
      to: order.guest_email,
      subject: `Order #${order.id} Confirmed — Playa Montana`,
      text: [
        `Hi ${order.guest_name},`,
        '',
        `Your order #${order.id} has been placed and sent to the kitchen.`,
        '',
        'Items:',
        itemLines,
        '',
        `Total: ₱${Number(order.total_amount).toFixed(2)}`,
        `Delivery: Room ${order.delivery_room || 'N/A'}`,
        `Charged to your booking.`,
        '',
        "Didn't place this order? Please contact the front desk immediately.",
        '',
        '— Playa Montana Resort',
      ].join('\n'),
    })
  } catch (err) {
    console.error('Failed to send order confirmation email:', err.message)
  }
}

module.exports = { sendOrderConfirmation }
