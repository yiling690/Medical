const conversations = []
const messages = []

let conversationSeq = 1
let messageSeq = 1

const getAccessiblePatientIds = (user) => {
  if (user.role !== 'patient') {
    return []
  }

  const ids = new Set()
  if (user.patientId) {
    ids.add(user.patientId)
  }
  if (user.id) {
    ids.add(`TEMP-${user.id}`)
  }

  return Array.from(ids)
}

const listUserConversations = (user) => {
  if (user.role === 'doctor') {
    return conversations.filter((item) => item.doctorName === user.name)
  }

  if (user.role === 'patient') {
    const patientIds = getAccessiblePatientIds(user)
    return conversations.filter((item) => patientIds.includes(item.patientId))
  }

  return []
}

const getConversationById = (id) =>
  conversations.find((item) => item.id === id)

const canAccessConversation = (user, conversation) => {
  if (!conversation) {
    return false
  }

  if (user.role === 'doctor') {
    return conversation.doctorName === user.name
  }

  if (user.role === 'patient') {
    return getAccessiblePatientIds(user).includes(conversation.patientId)
  }

  return false
}

const getConversationMessages = (conversationId) =>
  messages
    .filter((item) => item.conversationId === conversationId)
    .sort((a, b) => a.createdAt - b.createdAt)

const createConversationFromAppointment = (appointment) => {
  const existing = conversations.find(
    (item) => item.appointmentId === appointment.id,
  )

  if (existing) {
    return existing
  }

  const timestamp = Date.now()
  const conversation = {
    id: conversationSeq++,
    appointmentId: appointment.id,
    patientId: appointment.patientId,
    patientName: appointment.patientName,
    doctorName: appointment.doctorName,
    hospital: appointment.hospital,
    department: appointment.department,
    appointmentDate: appointment.date,
    appointmentTime: appointment.time,
    lastMessagePreview: '',
    lastMessageSender: null,
    lastMessageAt: timestamp,
    lastReadAtDoctor: 0,
    lastReadAtPatient: 0,
    createdAt: timestamp,
  }

  conversations.push(conversation)
  return conversation
}

const addConversationMessage = ({
  conversationId,
  sender,
  senderName,
  content,
}) => {
  const conversation = getConversationById(conversationId)
  if (!conversation) {
    return null
  }

  const timestamp = Date.now()
  const message = {
    id: messageSeq++,
    conversationId,
    sender,
    senderName,
    content,
    createdAt: timestamp,
  }

  messages.push(message)
  conversation.lastMessagePreview = content
  conversation.lastMessageSender = sender
  conversation.lastMessageAt = timestamp

  if (sender === 'doctor') {
    conversation.lastReadAtDoctor = timestamp
  }

  if (sender === 'patient') {
    conversation.lastReadAtPatient = timestamp
  }

  return message
}

const markConversationRead = (conversation, role) => {
  const timestamp = Date.now()

  if (role === 'doctor') {
    conversation.lastReadAtDoctor = timestamp
  }

  if (role === 'patient') {
    conversation.lastReadAtPatient = timestamp
  }
}

const getConversationUnreadCount = (conversation, role) => {
  const lastReadAt =
    role === 'doctor' ? conversation.lastReadAtDoctor : conversation.lastReadAtPatient
  const senderToCount = role === 'doctor' ? 'patient' : 'doctor'

  return messages.filter(
    (item) =>
      item.conversationId === conversation.id &&
      item.sender === senderToCount &&
      item.createdAt > lastReadAt,
  ).length
}

module.exports = {
  conversations,
  messages,
  listUserConversations,
  getConversationById,
  canAccessConversation,
  getConversationMessages,
  createConversationFromAppointment,
  addConversationMessage,
  markConversationRead,
  getConversationUnreadCount,
}
