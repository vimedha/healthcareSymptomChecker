'use client'

import { useUser } from '@clerk/nextjs'
import { ChatSidebar } from '@/components/chat-sidebar'
import { Menu, Image, Mic, MicOff, Send } from 'lucide-react'
import { useState, useRef, useCallback, useEffect } from 'react'
import { ChatMessages } from './chat-messages'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'

export interface Message {
  id: string
  type: 'user' | 'bot'
  content: string
  contentType: 'text' | 'image' | 'audio'
  timestamp: Date | string
  transcription?: string
}

export function ChatInterface() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { user } = useUser()
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [isRecording, setIsRecording] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages])

  const handleSendText = () => {
    if (message.trim() && !isLoading) {
      handleSendMessage(message.trim(), 'text')
      setMessage('')
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto'
      }
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendText()
    }
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleSendMessage(`Image: ${file.name}`, 'image', file)
    }
  }

  const startRecording = useCallback(async () => {
    try {
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
      timerRef.current = setInterval(() => {}, 1000)
    } catch {
      alert('Microphone access denied or unavailable. Please allow microphone permissions.')
    }
  }, [])

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

  const handleSendMessage = async (
    content: string,
    type: 'text' | 'image' | 'audio',
    file?: File
  ) => {
    let userContent = content
    if (type === 'image' && file) {
      userContent = URL.createObjectURL(file)
    }
    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: userContent,
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
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ symptoms: content }),
        })
      } else if (type === 'image' && file) {
        const formData = new FormData()
        formData.append('image', file)
        response = await fetch('/api/check-image', { method: 'POST', body: formData })
      } else if (type === 'audio' && file) {
        const formData = new FormData()
        formData.append('audio', file)
        response = await fetch('/api/stream-audio', { method: 'POST', body: formData })
      }
      if (response) {
        const data = await response.json()
        if (type === 'image') {
          setMessages(prev => [
            ...prev.slice(0, prev.length - 1),
            { ...userMessage, content: data.imageData, contentType: 'image' }
          ])
          const botMessage: Message = {
            id: (Date.now() + 1).toString(),
            type: 'bot',
            content: data.diagnosis || "Sorry, I couldn't process your request.",
            contentType: 'text',
            timestamp: new Date(),
            transcription: data.transcription,
          }
          setMessages(prev => [...prev, botMessage])
        } else {
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
      }
    } catch {
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

  const handleSelectChat = (chat: any) => {
    if (chat.type === 'image' && chat.imageData) {
      setMessages([
        {
          id: chat.id + '-u',
          type: 'user',
          content: chat.imageData,
          contentType: 'image',
          timestamp: chat.createdAt,
        },
        {
          id: chat.id + '-b',
          type: 'bot',
          content: chat.diagnosis,
          contentType: 'text',
          timestamp: chat.createdAt,
        },
      ])
    } else {
      setMessages([
        {
          id: chat.id + '-u',
          type: 'user',
          content: chat.symptoms,
          contentType: chat.type || 'text',
          timestamp: chat.createdAt,
        },
        {
          id: chat.id + '-b',
          type: 'bot',
          content: chat.diagnosis,
          contentType: 'text',
          timestamp: chat.createdAt,
        },
      ])
    }
    setSidebarOpen(false)
  }

  return (
    <div className="relative flex flex-col h-full bg-gray-900/80 rounded-2xl border border-gray-700 overflow-hidden shadow-lg max-w-4xl mx-auto">
      <button
        onClick={() => setSidebarOpen(true)}
        className="fixed top-4 left-4 z-50 p-3 bg-gray-800/90 backdrop-blur-sm text-white hover:bg-gray-700 transition-colors rounded-lg shadow-lg"
        aria-label="Open chat history"
      >
        <Menu className="h-6 w-6" />
      </button>
      <ChatSidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        userId={user?.id || "anonymous"}
        onSelectChat={handleSelectChat}
      />
      <div className="flex-1 p-6 overflow-y-auto pt-20">
        <ScrollArea className="space-y-6 h-full">
          <ChatMessages messages={messages} isLoading={isLoading} />
          <div ref={scrollRef} />
        </ScrollArea>
      </div>
      <div className="border-t border-gray-700 px-6 py-3 bg-gray-800/95">
        <div className="flex items-center gap-4 px-2">
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
                className="w-full h-12 min-h-[40px] max-h-15 resize-none bg-gray-900/50 border border-gray-600/50 rounded-xl px-4 py-2.5 text-white placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 transition-all duration-200 outline-none"
                style={{ height: 'auto' }}
                onInput={(e) => {
                  const target = e.target as HTMLTextAreaElement
                  target.style.height = 'auto'
                  target.style.height = `${target.scrollHeight}px`
                }}
              />
              {isRecording && (
                <div className="absolute top-2 right-16 z-10">
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                    <span className="text-xs text-red-400 font-medium">Recording...</span>
                  </div>
                </div>
              )}
            </form>
          </div>
          <div className="flex items-center space-x-4">
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
              size="lg"
              onClick={() => fileInputRef.current?.click()}
              className={`h-12 w-12 p-0 rounded-xl transition-colors duration-200 ${isLoading ? 'cursor-not-allowed opacity-50' : 'hover:bg-gray-700/50 text-gray-400'}`}
              disabled={isLoading}
              aria-label="Upload image"
            >
              <Image className="h-8 w-8" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="lg"
              onClick={isRecording ? stopRecording : startRecording}
              className={`h-12 w-12 p-0 rounded-xl transition-colors duration-200 ${isRecording ? 'bg-red-500/20 text-red-400 border border-red-500/30' : isLoading ? 'cursor-not-allowed opacity-50 text-gray-400' : 'hover:bg-gray-700/50 text-gray-400'}`}
              disabled={isLoading && !isRecording}
              aria-label={isRecording ? 'Stop recording' : 'Start recording'}
            >
              {isRecording ? <MicOff className="h-8 w-8" /> : <Mic className="h-8 w-8" />}
            </Button>
            <Button
              type="submit"
              onClick={handleSendText}
              disabled={!message.trim() || isLoading}
              className={`h-12 w-12 p-0 rounded-xl transition-all duration-200 ${message.trim() && !isLoading ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/25 transform hover:scale-105' : 'bg-gray-600/50 text-gray-400 cursor-not-allowed'}`}
              aria-label="Send message"
            >
              <Send className="h-8 w-8" />
            </Button>
          </div>
        </div>
        {isLoading && (
          <div className="ml-4 flex items-center space-x-2"></div>
        )}
      </div>
    </div>
  )
}
