const express = require('express')
const authMiddleware = require('../middleware/auth')
const checkRole = require('../middleware/role')

const router = express.Router()

// 模拟 AI 诊断建议接口
router.post('/suggest', authMiddleware, checkRole(['doctor']), async (req, res) => {
  const { symptoms } = req.body

  if (!symptoms) {
    return res.status(400).json({ message: '请输入症状描述' })
  }

  // 这里模拟一个简单的 AI 逻辑，实际应用中可以对接 LLM API
  const suggestions = [
    {
      diagnosis: '普通感冒',
      confidence: 0.85,
      treatment: '建议休息，多喝水，必要时服用解热镇痛药。',
    },
    {
      diagnosis: '流行性感冒',
      confidence: 0.6,
      treatment: '建议进行流感病毒筛查，可考虑使用奥司他韦等抗病毒药物。',
    },
    {
      diagnosis: '过敏性鼻炎',
      confidence: 0.4,
      treatment: '建议远离过敏原，使用抗组胺药物。',
    },
  ]

  // 简单的关键词匹配模拟 AI
  let filtered = suggestions
  if (symptoms.includes('发烧')) {
    filtered = suggestions.filter((s) => s.diagnosis.includes('感冒'))
  }

  res.json({
    symptoms,
    suggestions: filtered,
    note: '此结果由 AI 模拟生成，仅供临床参考。',
  })
})

module.exports = router
