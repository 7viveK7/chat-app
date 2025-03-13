"use client"

import { useState, useEffect, useCallback } from "react"
import { v4 as uuidv4 } from "uuid"
import { useIndexedDB } from "@/hooks/use-indexed-db"
import type { ChatMessage, Chat } from "@/lib/types"

export function useChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [activeChat, setActiveChatState] = useState<Chat | null>(null)
  const [chats, setChats] = useState<Chat[]>([])
  const { getItem, setItem, getAllItems } = useIndexedDB("chats")

  // Load chats from IndexedDB
  useEffect(() => {
    const loadChats = async () => {
      try {
        const savedChats = await getAllItems()
        if (savedChats && savedChats.length > 0) {
          setChats(savedChats)
          setActiveChatState(savedChats[0])
          setMessages(savedChats[0].messages || [])
        } else {
          // Create a default chat if none exists
          const newChat = createDefaultChat()
          setChats([newChat])
          setActiveChatState(newChat)
        }
      } catch (error) {
        console.error("Error loading chats:", error)
        // Create a default chat if there's an error
        const newChat = createDefaultChat()
        setChats([newChat])
        setActiveChatState(newChat)
      }
    }

    loadChats()
  }, [])

  const createDefaultChat = () => {
    return {
      id: uuidv4(),
      title: "New Chat",
      createdAt: new Date().toISOString(),
      messages: [],
    }
  }

  const saveChat = useCallback(
    async (chat: Chat) => {
      try {
        await setItem(chat.id, chat)
        setChats((prevChats) => {
          const index = prevChats.findIndex((c) => c.id === chat.id)
          if (index >= 0) {
            const updatedChats = [...prevChats]
            updatedChats[index] = chat
            return updatedChats
          }
          return [...prevChats, chat]
        })
      } catch (error) {
        console.error("Error saving chat:", error)
      }
    },
    [setItem],
  )

  const setActiveChat = useCallback(
    async (chatId: string) => {
      const chat = chats.find((c) => c.id === chatId)
      if (chat) {
        setActiveChatState(chat)
        setMessages(chat.messages || [])
      }
    },
    [chats],
  )

  const createNewChat = useCallback(async () => {
    const newChat = createDefaultChat()
    await saveChat(newChat)
    setActiveChatState(newChat)
    setMessages([])
  }, [saveChat])

  const deleteChat = useCallback(
    async (chatId: string) => {
      try {
        setChats((prevChats) => prevChats.filter((chat) => chat.id !== chatId))

        // If we're deleting the active chat, switch to another one
        if (activeChat?.id === chatId) {
          const remainingChats = chats.filter((chat) => chat.id !== chatId)
          if (remainingChats.length > 0) {
            setActiveChatState(remainingChats[0])
            setMessages(remainingChats[0].messages || [])
          } else {
            // Create a new chat if we deleted the last one
            createNewChat()
          }
        }
      } catch (error) {
        console.error("Error deleting chat:", error)
      }
    },
    [activeChat, chats, createNewChat],
  )

  const sendMessage = useCallback(
    async (content: string) => {
      if (!activeChat) return

      // Add user message to state
      const userMessage: ChatMessage = { role: "user", content }
      const updatedMessages = [...messages, userMessage]
      setMessages(updatedMessages)
      setIsLoading(true)

      // Update chat with user message
      const updatedChat = {
        ...activeChat,
        messages: updatedMessages,
        title:
          activeChat.title === "New Chat" && messages.length === 0
            ? content.slice(0, 30) + (content.length > 30 ? "..." : "")
            : activeChat.title,
      }
      await saveChat(updatedChat)

      try {
        // Send message to API
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: updatedMessages,
            chatId: activeChat.id,
          }),
        })

        if (!response.ok) {
          throw new Error("Failed to send message")
        }

        if (!response.body) {
          throw new Error("Response body is null")
        }

        // Handle streaming response
        const reader = response.body.getReader()
        const decoder = new TextDecoder()
        let aiResponse = ""

        // Add an empty AI message that we'll update as chunks arrive
        const aiMessage: ChatMessage = { role: "assistant", content: "" }
        setMessages([...updatedMessages, aiMessage])

        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          const chunk = decoder.decode(value, { stream: true })
          aiResponse += chunk

          // Update the AI message with the accumulated response
          setMessages((currentMessages) => {
            const updatedAiMessages = [...currentMessages]
            updatedAiMessages[updatedAiMessages.length - 1] = {
              role: "assistant",
              content: aiResponse,
            }
            return updatedAiMessages
          })
        }

        // Final messages with complete AI response
        const finalMessages = [...updatedMessages, { role: "assistant", content: aiResponse }]

        // Save the complete conversation
        const finalChat = {
          ...updatedChat,
          messages: finalMessages,
        }
        await saveChat(finalChat)

        setMessages(finalMessages)
      } catch (error) {
        console.error("Error sending message:", error)
        // Add error message
        setMessages([
          ...updatedMessages,
          { role: "assistant", content: "Sorry, there was an error processing your request. Please try again." },
        ])
      } finally {
        setIsLoading(false)
      }
    },
    [activeChat, messages, saveChat],
  )

  return {
    messages,
    isLoading,
    activeChat,
    chats,
    sendMessage,
    createNewChat,
    deleteChat,
    setActiveChat,
  }
}

