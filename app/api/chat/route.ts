import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { streamText } from "ai" // Import from AI SDK [^1]
import { openai } from "@ai-sdk/openai" // Import from AI SDK OpenAI integration [^1]

export const runtime = "nodejs"

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const cookieStore = cookies()
    const sessionCookie = cookieStore.get("user-session")

    if (!sessionCookie) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { messages, chatId } = await request.json()

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: "Invalid messages format" }, { status: 400 })
    }

    // Create a readable stream to send the response
    const encoder = new TextEncoder()
    const stream = new TransformStream()
    const writer = stream.writable.getWriter()

    // Process with AI SDK
    const prompt = formatMessagesForLLM(messages)

    // Start streaming the response
    streamText({
      model: openai("gpt-4o"),
      prompt: prompt,
      system: "You are a helpful assistant.",
      onChunk: async ({ chunk }) => {
        if (chunk.type === "text-delta") {
          await writer.write(encoder.encode(chunk.text))
        }
      },
      onFinish: async () => {
        await writer.close()
      },
    })

    return new NextResponse(stream.readable)
  } catch (error) {
    console.error("Chat API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// Format messages for the LLM
function formatMessagesForLLM(messages: any[]) {
  return messages
    .map((msg) => {
      if (msg.role === "user") {
        return `User: ${msg.content}`
      } else if (msg.role === "assistant") {
        return `Assistant: ${msg.content}`
      } else {
        return `${msg.role}: ${msg.content}`
      }
    })
    .join("\n")
}

