const express = require('express')
const cors = require('cors')
const authRoutes = require('./routes/auth')
const patientRoutes = require('./routes/patient')
const statsRoutes = require('./routes/stats')

const app = express()

app.use(cors())
app.use(express.json())

app.get('/api/test', (req, res) => {
  res.send({ msg: 'server running' })
})

app.use('/api/auth', authRoutes)
app.use('/api/patient', patientRoutes)
app.use('/api/stats', statsRoutes)

module.exports = app

