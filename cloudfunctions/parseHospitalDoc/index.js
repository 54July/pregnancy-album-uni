// 云函数：parseHospitalDoc
// 调用豆包视觉 API 识别医院待产包文档截图，返回结构化分类清单
// API Key 存放在云函数环境变量 DOUBAO_API_KEY 中，不暴露给客户端

const https = require('https')

const DOUBAO_API_URL = 'ark.cn-beijing.volces.com'
const MODEL = 'doubao-1-5-vision-pro-32k-250115'

const PROMPT = `你是一个专业的待产包清单助手。请从以下医院文档截图中提取所有需要准备的物品，整理成结构化的分类清单。

要求：
1. 按照物品类型分类（如：入院准备、妈妈用品、宝宝用品、分娩用品等）
2. 每个分类给一个合适的 emoji 图标
3. 保留原文的物品名称，可以适当简化
4. 忽略文档中的注意事项、规定说明等非物品内容
5. 去除重复物品

请以如下 JSON 格式返回（只返回 JSON，不要有其他文字）：
{
  "title": "清单标题（如医院名称+待产包清单）",
  "categories": [
    {
      "name": "分类名称",
      "icon": "emoji",
      "items": ["物品1", "物品2", "物品3"]
    }
  ]
}`

/**
 * 发起 HTTPS POST 请求（云函数内置 Node.js，不能用 fetch，用 https 模块）
 */
function httpsPost(options, body) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = ''
      res.on('data', (chunk) => { data += chunk })
      res.on('end', () => {
        try {
          resolve({ statusCode: res.statusCode, body: JSON.parse(data) })
        } catch (e) {
          reject(new Error('响应解析失败: ' + data.slice(0, 200)))
        }
      })
    })
    req.on('error', reject)
    req.write(body)
    req.end()
  })
}

exports.main = async (event) => {
  const { images } = event

  if (!Array.isArray(images) || images.length === 0) {
    return { code: 400, message: '请至少上传一张图片' }
  }
  if (images.length > 9) {
    return { code: 400, message: '最多支持 9 张图片' }
  }

  // API Key 从环境变量读取，在微信云开发控制台配置
  const apiKey = process.env.DOUBAO_API_KEY
  if (!apiKey) {
    return { code: 500, message: '服务未配置，请联系开发者' }
  }

  // 构建多图消息：图片在前，prompt 在后
  const content = [
    ...images.map((b64) => ({
      type: 'image_url',
      image_url: { url: `data:image/jpeg;base64,${b64}` },
    })),
    { type: 'text', text: PROMPT },
  ]

  const requestBody = JSON.stringify({
    model: MODEL,
    max_tokens: 2048,
    messages: [{ role: 'user', content }],
  })

  try {
    const response = await httpsPost(
      {
        hostname: DOUBAO_API_URL,
        path: '/api/v3/chat/completions',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
          'Content-Length': Buffer.byteLength(requestBody),
        },
      },
      requestBody,
    )

    if (response.statusCode !== 200) {
      const errMsg = response.body?.error?.message || `HTTP ${response.statusCode}`
      return { code: response.statusCode, message: `AI 服务错误：${errMsg}` }
    }

    const text = response.body.choices?.[0]?.message?.content ?? ''

    // 提取 JSON（可能被 markdown 代码块包裹）
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      return { code: 500, message: 'AI 返回内容格式有误，请重试' }
    }

    const parsed = JSON.parse(jsonMatch[0])
    if (!parsed.categories?.length) {
      return { code: 500, message: '未能从图片中提取到物品分类，请确认图片内容清晰' }
    }

    return { code: 200, data: parsed }
  } catch (e) {
    return { code: 500, message: e.message || '解析失败，请重试' }
  }
}