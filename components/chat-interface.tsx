'use client'

import { useUser } from '@clerk/nextjs' // Add this import for user ID
import { ChatSidebar } from "@/components/chat-sidebar"
import { Menu } from "lucide-react"

import { useState, useRef, useCallback, useEffect } from 'react'
import { ChatMessages } from './chat-messages'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import { Image, Mic, MicOff, Send } from 'lucide-react'

export interface Message {
  id: string
  type: 'user' | 'bot'
  content: string
  contentType: 'text' | 'image' | 'audio'
  timestamp: Date
  transcription?: string
}

export function ChatInterface() {
  // Sidebar state
  const [sidebarOpen, setSidebarOpen] = useState(false)
  
  // Clerk user hook for sidebar (requires user ID)
  const { user } = useUser()

  // Chat state
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [isRecording, setIsRecording] = useState(false)
  
  const scrollRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  // Auto-scroll to bottom
  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }

  // Send text message handler
  const handleSendText = () => {
    if (message.trim() && !isLoading) {
      handleSendMessage(message.trim(), 'text')
      setMessage('')
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto'
      }
    }
  }

  // Handle Enter key press
  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendText()
    }
  }

  // Handle image upload
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleSendMessage(`Image: ${file.name}`, 'image', file)
    }
  }

  // Start audio recording
  const startRecording = useCallback(async () => {
    try {
      // Check if getUserMedia is available (fixes the error)
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        alert('Microphone access is not available. Please use localhost or HTTPS.')
        return
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = new MediaRecorder(stream)
      const chunks: BlobPart[] = []

      recorder.ondataavailable = (e) => {
        chunks.push(e.data)
      }

      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/wav' })
        const file = new File([blob], 'recording.wav', { type: 'audio/wav' })
        handleSendMessage('Voice recording', 'audio', file)
        stream.getTracks().forEach(track => track.stop())
      }

      recorder.start()
      mediaRecorderRef.current = recorder
      setIsRecording(true)
      
      timerRef.current = setInterval(() => {
        // Update recording time display if needed
      }, 1000)
    } catch (error) {
      console.error('Error starting recording:', error)
      alert('Microphone access denied or unavailable. Please allow microphone permissions.')
    }
  }, [])

  // Stop audio recording
  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      mediaRecorderRef.current = null
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [isRecording])

  // Main message handler
  const handleSendMessage = async (
    content: string,
    type: 'text' | 'image' | 'audio',
    file?: File
  ) => {
    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content,
      contentType: type,
      timestamp: new Date(),
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
          body: JSON.stringify({ symptoms: content }),
        })
      } else if (type === 'image' && file) {
        const formData = new FormData()
        formData.append('image', file)

        response = await fetch('/api/check-image', {
          method: 'POST',
          body: formData,
        })
      } else if (type === 'audio' && file) {
        const formData = new FormData()
        formData.append('audio', file)

        response = await fetch('/api/stream-audio', {
          method: 'POST',
          body: formData,
        })
      }

      if (response) {
        const data = await response.json()

        const botMessage: Message = {
          id: (Date.now() + 1).toString(),
          type: 'bot',
          content: data.diagnosis || "Sorry, I couldn't process your request.",
          contentType: 'text',
          timestamp: new Date(),
          transcription: data.transcription,
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
        timestamp: new Date(),
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="relative flex flex-col h-full bg-gray-900/80 rounded-2xl border border-gray-700 overflow-hidden shadow-lg max-w-4xl mx-auto">
      
      {/* Hamburger Menu Button - Top Left */}
      <button
        onClick={() => setSidebarOpen(true)}
        className="fixed top-4 left-4 z-50 p-2 rounded-lg bg-gray-800/90 backdrop-blur-sm text-white hover:bg-gray-700 transition-colors"
        aria-label="Open chat history"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Sidebar Drawer */}
      <ChatSidebar 
        open={sidebarOpen} 
        onClose={() => setSidebarOpen(false)} 
        userId={user?.id || "anonymous"} // Use Clerk user ID
      />

      {/* Main Chat Content */}
      <ScrollArea className="flex-1 p-6 overflow-y-auto space-y-6 pt-20">
        <ChatMessages messages={messages} isLoading={isLoading} />
        <div ref={scrollRef} />
      </ScrollArea>

      {/* Input Container - Centered with Icons on Right */}
      <div className="border-t border-gray-700 px-6 py-3 bg-gray-800/95">
        <div className="flex items-center gap-3">
          {/* Input Area - Takes up full available space */}
          <div className="flex-1 relative">
            <form 
              onSubmit={(e) => {
                e.preventDefault()
                handleSendText()
              }}
              className="relative"
            >
              <textarea
                ref={textareaRef}
                placeholder="Describe your symptoms here..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={handleKeyPress}
                disabled={isLoading}
                className="w-full h-10 min-h-[40px] max-h-32 resize-none bg-gray-900/50 border border-gray-600/50 rounded-xl px-4 py-2.5 text-white placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 transition-all duration-200 outline-none"
                style={{ height: 'auto' }}
                onInput={(e) => {
                  const target = e.target as HTMLTextAreaElement
                  target.style.height = 'auto'
                  target.style.height = `${target.scrollHeight}px`
                }}
              />

              {/* Recording indicator */}
              {isRecording && (
                <div className="absolute top-2 right-40 z-10">
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                    <span className="text-xs text-red-400 font-medium">Recording...</span>
                  </div>
                </div>
              )}
            </form>
          </div>

          {/* Right-side Icons - Now with larger h-6 w-6 icons */}
          <div className="flex items-center space-x-2">
            {/* File Upload */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              className="h-12 w-12 p-0 rounded-xl hover:bg-gray-700/50"
              disabled={isLoading}
            >
              <Image className="h-6 w-6 text-gray-400" />
            </Button>

            {/* Audio Recording */}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={isRecording ? stopRecording : startRecording}
              className={`h-12 w-12 p-0 rounded-xl ${
                isRecording 
                  ? 'bg-red-500/20 text-red-400 border border-red-500/30' 
                  : 'hover:bg-gray-700/50 text-gray-400'
              }`}
              disabled={isLoading && !isRecording}
            >
              {isRecording ? (
                <MicOff className="h-6 w-6" />
              ) : (
                <Mic className="h-6 w-6" />
              )}
            </Button>

            {/* Send Button */}
            <Button
              type="submit"
              onClick={handleSendText}
              disabled={!message.trim() || isLoading}
              className={`h-12 w-12 p-0 rounded-xl transition-all duration-200 ${
                message.trim() && !isLoading
                  ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/25 transform hover:scale-105' 
                  : 'bg-gray-600/50 text-gray-400 cursor-not-allowed'
              }`}
            >
              <Send className="h-6 w-6" />
            </Button>
          </div>

          {/* Loading Indicator */}
          {isLoading && (
            <div className="ml-4 flex items-center space-x-2">
              <div className="text-blue-400 text-sm italic font-medium select-none">
                Analyzing symptoms...
              </div>
              <div className="flex space-x-1">
                <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" />
                <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
