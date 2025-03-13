"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Loader2, Send, Plus, Trash2 } from "lucide-react"
import { useChat } from "@/hooks/use-chat"
import { useOnlineStatus } from "@/hooks/use-online-status"

export function ChatUI() {
  const [input, setInput] = useState("")
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const isOnline = useOnlineStatus()

  const { messages, isLoading, activeChat, chats, sendMessage, createNewChat, deleteChat, setActiveChat } = useChat()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (input.trim() && !isLoading) {
      sendMessage(input)
      setInput("")
    }
  }

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <div className="w-64 bg-gray-50 border-r border-gray-200 p-4 flex flex-col">
        <Button onClick={createNewChat} className="mb-4 flex items-center justify-center gap-2">
          <Plus size={16} /> New Chat
        </Button>

        <div className="flex-1 overflow-y-auto space-y-2">
          {chats.map((chat) => (
            <div
              key={chat.id}
              className={`flex items-center justify-between p-2 rounded-md cursor-pointer ${
                activeChat?.id === chat.id ? "bg-primary text-primary-foreground" : "hover:bg-gray-100"
              }`}
              onClick={() => setActiveChat(chat.id)}
            >
              <span className="truncate flex-1">{chat.title || "New Chat"}</span>
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => {
                  e.stopPropagation()
                  deleteChat(chat.id)
                }}
                className={activeChat?.id === chat.id ? "text-primary-foreground hover:bg-primary/90" : ""}
              >
                <Trash2 size={16} />
              </Button>
            </div>
          ))}
        </div>

        <div className="mt-auto pt-4 border-t border-gray-200">
          <div className={`text-sm ${isOnline ? "text-green-600" : "text-red-600"}`}>
            {isOnline ? "Online" : "Offline"}
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        <Card className="flex-1 flex flex-col border-0 rounded-none">
          <CardHeader className="border-b">
            <CardTitle>{activeChat?.title || "New Chat"}</CardTitle>
          </CardHeader>

          <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 ? (
              <div className="h-full flex items-center justify-center text-gray-400">Start a new conversation</div>
            ) : (
              messages.map((message, index) => (
                <div key={index} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[80%] rounded-lg p-3 ${
                      message.role === "user" ? "bg-primary text-primary-foreground" : "bg-gray-100"
                    }`}
                  >
                    {message.content}
                  </div>
                </div>
              ))
            )}
            {isLoading && (
              <div className="flex justify-start">
                <div className="max-w-[80%] rounded-lg p-3 bg-gray-100">
                  <Loader2 className="h-5 w-5 animate-spin" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </CardContent>

          <div className="p-4 border-t">
            <form onSubmit={handleSubmit} className="flex gap-2">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type your message..."
                className="flex-1 resize-none"
                rows={1}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault()
                    handleSubmit(e)
                  }
                }}
              />
              <Button type="submit" size="icon" disabled={isLoading || !input.trim()}>
                <Send size={18} />
              </Button>
            </form>
          </div>
        </Card>
      </div>
    </div>
  )
}

