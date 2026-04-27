const express = require('express')
const authMiddleware = require('../middleware/auth')
const {
  getChats,
  getChatMessages,
  sendChatMessage,
} = require('../controllers/chatController')

const router = express.Router()

router.get('/', authMiddleware, getChats)
router.get('/:id/messages', authMiddleware, getChatMessages)
router.post('/:id/messages', authMiddleware, sendChatMessage)

module.exports = router
