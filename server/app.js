const express = require('express')
const cors = require('cors')
const path = require('path')
const authRoutes = require('./routes/auth')
const appointmentRoutes = require('./routes/appointment')
const chatRoutes = require('./routes/chat')
const patientRoutes = require('./routes/patient')
const statsRoutes = require('./routes/stats')
const aiRoutes = require('./routes/ai')
const uploadRoutes = require('./routes/upload')

const app = express()

app.use(cors())
app.use(express.json())
app.use('/uploads', express.static(path.join(__dirname, 'uploads')))

app.get('/api/test', (req, res) => {
  res.send({ msg: 'server running' })
})

app.use('/api/auth', authRoutes)
app.use('/api/appointments', appointmentRoutes)
app.use('/api/chats', chatRoutes)
app.use('/api/patient', patientRoutes)
app.use('/api/stats', statsRoutes)
app.use('/api/ai', aiRoutes)
app.use('/api/files', uploadRoutes)

module.exports = app

