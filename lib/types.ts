export interface ChatMessage {
  role: "user" | "assistant" | "system"
  content: string
}

export interface Chat {
  id: string
  title: string
  createdAt: string
  messages: ChatMessage[]
}

