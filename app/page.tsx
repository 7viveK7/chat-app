import { redirect } from "next/navigation"
import { cookies } from "next/headers"
import { ChatUI } from "@/components/chat-ui"

export default function Home() {
  const cookieStore = cookies()
  const isLoggedIn = cookieStore.has("user-session")

  if (!isLoggedIn) {
    redirect("/login")
  }

  return (
    <main className="flex min-h-screen flex-col">
      <ChatUI />
    </main>
  )
}

