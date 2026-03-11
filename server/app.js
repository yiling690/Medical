const express = require('express')
const cors = require('cors')
const { router: authRoutes } = require('./routes/auth')
const patientRoutes = require('./routes/patient')

const app = express()
const PORT = 3000

app.use(cors())
app.use(express.json())

app.get('/api/test', (req, res) => {
  res.send({ msg: 'server running' })
})

app.use('/api/auth', authRoutes)
app.use('/api/patient', patientRoutes)

app.listen(PORT, () => {
  console.log(`server start ${PORT}`)
})

