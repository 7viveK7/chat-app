import { cookies } from "next/headers"
import { type NextRequest, NextResponse } from "next/server"

// In a real app, you would validate credentials against a database
// This is a simplified example for demonstration purposes
export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    // Simple validation
    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 })
    }

    // In a real app, you would validate against a database
    // For this demo, we'll accept any credentials

    // Set a cookie to simulate authentication
    const cookieStore = cookies()
    cookieStore.set({
      name: "user-session",
      value: Buffer.from(JSON.stringify({ email, timestamp: Date.now() })).toString("base64"),
      httpOnly: true,
      path: "/",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 7, // 1 week
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Login error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

