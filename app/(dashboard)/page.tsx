'use client'

import { ChatInterface } from '@/components/chat-interface'
import { useState, useEffect } from 'react'
import { useUser } from '@clerk/nextjs'

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
          <div className="mb-8 fade-in">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                <span className="text-2xl">👋</span>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-foreground">
                  Hello, {user?.firstName || 'there'}!
                </h1>
                <p className="text-muted-foreground text-lg">
                  Welcome to your AI health assistant
                </p>
              </div>
            </div>
            <div className="bg-card/50 border border-border rounded-xl p-6 backdrop-blur-sm">
              <p className="text-foreground leading-relaxed">
                I&apos;m here to help analyze your symptoms with advanced AI technology. 
                You can describe them through text, voice recordings, or upload images for analysis.
              </p>
            </div>
          </div>
          <ChatInterface />
        </div>
      </div>
    </div>
  )
}
