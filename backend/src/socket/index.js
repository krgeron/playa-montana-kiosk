module.exports = function (io) {
  io.on('connection', (socket) => {
    console.log(`Kitchen display connected: ${socket.id}`)
    socket.emit('connection_ack', { timestamp: new Date().toISOString() })

    socket.on('disconnect', () => {
      console.log(`Kitchen display disconnected: ${socket.id}`)
    })
  })
}
