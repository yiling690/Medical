const app = require('./app')
const { APP_PORT } = require('./config/appConfig')

app.listen(APP_PORT, () => {
  console.log(`server start ${APP_PORT}`)
})
