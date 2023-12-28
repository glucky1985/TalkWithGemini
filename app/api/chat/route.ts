import { GoogleGenerativeAI, type InputContent } from '@fuyun/generative-ai'
import { GoogleGenerativeAIStream, StreamingTextResponse, Message } from 'ai'

type GeminiRequest = {
  model?: 'gemini-pro' | 'gemini-pro-vision'
  messages?: Message[]
}

const geminiApiKey = process.env.GEMINI_API_KEY as string
const geminiApiBaseUrl = process.env.GEMINI_API_BASE_URL as string

function transformMessage(message: Message) {
  return {
    role: message.role === 'user' ? 'user' : 'model',
    parts: [
      {
        text: message.content,
      },
    ],
  }
}

export async function POST(req: Request) {
  const { messages = [], model = 'gemini-pro' } = (await req.json()) as GeminiRequest

  const genAI = new GoogleGenerativeAI(geminiApiKey, geminiApiBaseUrl)
  const geminiModel = genAI.getGenerativeModel({ model })

  const history = messages.length > 1 ? messages.slice(0, -1) : []
  console.log(history.map((msg) => transformMessage(msg)))
  const chat = geminiModel.startChat({
    history: history.map((msg) => transformMessage(msg)),
    generationConfig: {
      maxOutputTokens: 2000,
    },
  })

  const newMessage = transformMessage(messages[messages.length - 1])
    .parts.map((part) => part.text)
    .join('')
  console.log(newMessage)
  const result = await chat.sendMessageStream(newMessage)
  const stream = GoogleGenerativeAIStream(result)
  return new StreamingTextResponse(stream)
}
