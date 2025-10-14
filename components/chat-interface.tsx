'use client'

import { useState, useRef, useEffect } from 'react'
import { ChatMessages } from './chat-messages'
import { ChatInput } from './chat-input'
import { ScrollArea } from '@/components/ui/scroll-area'

export interface Message {
  id: string
  type: 'user' | 'bot'
  content: string
  contentType: 'text' | 'image' | 'audio'
  timestamp: Date
  transcription?: string
}

export function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }

  const handleSendMessage = async (content: string, type: 'text' | 'image' | 'audio', file?: File) => {
    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content,
      contentType: type,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setIsLoading(true)

    try {
      let response
      
      if (type === 'text') {
        response = await fetch('/api/check-text', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ symptoms: content })
        })
      } else if (type === 'image' && file) {
        const formData = new FormData()
        formData.append('image', file)
        
        response = await fetch('/api/check-image', {
          method: 'POST',
          body: formData
        })
      } else if (type === 'audio' && file) {
        const formData = new FormData()
        formData.append('audio', file)
        
        response = await fetch('/api/stream-audio', {
          method: 'POST',
          body: formData
        })
      }

      if (response) {
        const data = await response.json()
        
        const botMessage: Message = {
          id: (Date.now() + 1).toString(),
          type: 'bot',
          content: data.diagnosis || 'Sorry, I couldn\'t process your request.',
          contentType: 'text',
          timestamp: new Date(),
          transcription: data.transcription
        }

        setMessages(prev => [...prev, botMessage])
      }
    } catch (error) {
      console.error('Error sending message:', error)
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'bot',
        content: 'Sorry, there was an error processing your request. Please try again.',
        contentType: 'text',
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-full bg-card/30 rounded-2xl border border-border overflow-hidden shadow-lg backdrop-blur-sm">
      <ScrollArea className="flex-1 p-6">
        <ChatMessages messages={messages} isLoading={isLoading} />
        <div ref={scrollRef} />
      </ScrollArea>
      
      <div className="border-t border-border bg-card/50 p-6 backdrop-blur-sm">
        <ChatInput onSendMessage={handleSendMessage} disabled={isLoading} />
      </div>
    </div>
  )
}
