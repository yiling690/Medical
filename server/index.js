const app = require('./app')
const { APP_PORT } = require('./config/appConfig')
const pool = require('./config/db')

async function startServer() {
  try {
    // 自动初始化数据库和表
    console.log('Initializing database...')
    await pool.initializeDatabase()
    
    app.listen(APP_PORT, () => {
      console.log(`server start ${APP_PORT}`)
    })
  } catch (error) {
    console.error('Failed to start server:', error)
    process.exit(1)
  }
}

startServer()
