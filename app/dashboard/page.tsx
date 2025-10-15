'use client'
import { useState, useEffect } from 'react'
import { useUser } from '@clerk/nextjs'
import { ChatInterface } from '@/components/chat-interface'

export default function DashboardPage() {
  const { user } = useUser()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return null
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 p-6">
        <div className="max-w-4xl mx-auto h-full">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-white mb-2">
              Hello, {user?.firstName || 'there'}! 👋
            </h1>
            <p className="text-gray-300">
              I'm here to help analyze your symptoms. You can describe them through text, voice, or images.
            </p>
          </div>
          <ChatInterface />
        </div>
      </div>
    </div>
  )
}
