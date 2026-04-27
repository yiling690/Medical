const {
  listUserConversations,
  getConversationById,
  canAccessConversation,
  getConversationMessages,
  addConversationMessage,
  markConversationRead,
  getConversationUnreadCount,
} = require('../models/chatModel')

const buildConversationPayload = (conversation, role) => ({
  ...conversation,
  unreadCount: getConversationUnreadCount(conversation, role),
})

const getChats = (req, res) => {
  const list = listUserConversations(req.user)
    .sort((a, b) => b.lastMessageAt - a.lastMessageAt)
    .map((item) => buildConversationPayload(item, req.user.role))

  res.json({ chats: list })
}

const getChatMessages = (req, res) => {
  const conversationId = Number(req.params.id)
  const conversation = getConversationById(conversationId)

  if (!conversation || !canAccessConversation(req.user, conversation)) {
    return res.status(404).json({ message: '会话不存在' })
  }

  markConversationRead(conversation, req.user.role)

  res.json({
    chat: buildConversationPayload(conversation, req.user.role),
    messages: getConversationMessages(conversationId),
  })
}

const sendChatMessage = (req, res) => {
  const conversationId = Number(req.params.id)
  const conversation = getConversationById(conversationId)

  if (!conversation || !canAccessConversation(req.user, conversation)) {
    return res.status(404).json({ message: '会话不存在' })
  }

  const content = `${req.body?.content || ''}`.trim()
  if (!content) {
    return res.status(400).json({ message: '消息内容不能为空' })
  }

  const message = addConversationMessage({
    conversationId,
    sender: req.user.role,
    senderName: req.user.name,
    content,
  })

  res.status(201).json({
    message: '发送成功',
    chat: buildConversationPayload(conversation, req.user.role),
    data: message,
  })
}

module.exports = {
  getChats,
  getChatMessages,
  sendChatMessage,
}
