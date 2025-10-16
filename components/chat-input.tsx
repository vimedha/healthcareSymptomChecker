'use client'

import { useState, useRef, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Send, Image, Loader2, Mic, MicOff } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'



interface ChatInputProps {
  onSendMessage: (content: string, type: 'text' | 'image' | 'audio', file?: File) => void
  disabled: boolean
}

export function ChatInput({ onSendMessage, disabled }: ChatInputProps) {
  const [message, setMessage] = useState('')
  const [isRecording, setIsRecording] = useState(false)
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null)
  const [recordingTime, setRecordingTime] = useState(0)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  const handleSendText = () => {
    if (message.trim() && !disabled) {
      onSendMessage(message.trim(), 'text')
      setMessage('')
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto'
      }
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendText()
    }
  }

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = new MediaRecorder(stream)
      const chunks: BlobPart[] = []

      recorder.ondataavailable = (e) => {
        chunks.push(e.data)
      }

      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/wav' })
        const file = new File([blob], 'recording.wav', { type: 'audio/wav' })
        onSendMessage('Voice recording', 'audio', file)
        stream.getTracks().forEach(track => track.stop())
      }

      recorder.start()
      setMediaRecorder(recorder)
      setIsRecording(true)
      setRecordingTime(0)

      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1)
      }, 1000)

      
      ;(async () => {
        try {
          const fd = new FormData()
          await fetch('/api/stream-audio', { method: 'POST', body: fd })
        } catch {}
      })()
    } catch (error) {
      console.error('Error starting recording:', error)
    }
  }, [onSendMessage])

  const stopRecording = useCallback(() => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop()
      setIsRecording(false)
      setMediaRecorder(null)
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [mediaRecorder, isRecording])

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      onSendMessage(`Image: ${file.name}`, 'image', file)
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="space-y-4">
      <AnimatePresence>
        {isRecording && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="flex items-center justify-center space-x-5 p-4 bg-red-600/25 rounded-lg border border-red-600/40 shadow-md"
          >
            <div className="flex items-center space-x-3">
              <div className="w-4 h-4 bg-red-500 rounded-full pulse-recording" />
              <span className="text-red-400 font-semibold tracking-wide select-none">Recording</span>
            </div>
            <span className="text-gray-300 font-mono tabular-nums select-text">
              {formatTime(recordingTime)}
            </span>
            <Button size="sm" variant="destructive" onClick={stopRecording} className="flex items-center space-x-1">
              <MicOff className="h-4 w-4" />
              <span>Stop</span>
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-end space-x-4">
        <div className="flex-1">
          <Textarea
            ref={textareaRef}
            placeholder="Describe your symptoms here..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyUp={handleKeyPress}
            disabled={disabled}
            className="min-h-[44px] max-h-36 resize-none bg-gray-800/80 border border-gray-700 text-white placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/40 rounded-md text-base font-medium shadow-sm transition-colors"
            style={{ height: 'auto' }}
            onInput={(e) => {
              const target = e.target as HTMLTextAreaElement
              target.style.height = 'auto'
              target.style.height = `${target.scrollHeight}px`
            }}
          />
        </div>

        <div className="flex space-x-3">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
          />

          <Button
            size="icon"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled || isRecording}
            className="border border-gray-600 bg-gray-800/90 hover:bg-gray-700/90 text-gray-300 rounded-md shadow-md transition-all"
          >
            <Image className="h-5 w-5" />
          </Button>

          <Button
            size="icon"
            variant="outline"
            onClick={isRecording ? stopRecording : startRecording}
            disabled={disabled}
            className={`border border-gray-600 ${
              isRecording ? 'bg-red-600 hover:bg-red-700 border-red-500' : 'bg-gray-800/90 hover:bg-gray-700/90'
            } text-gray-300 rounded-md shadow-md transition-all`}
          >
            {isRecording ? (
              <MicOff className="h-5 w-5" />
            ) : (
              <Mic className="h-5 w-5" />
            )}
          </Button>

          <Button
            size="icon"
            onClick={handleSendText}
            disabled={!message.trim() || disabled || isRecording}
            className="bg-blue-600 hover:bg-blue-700 text-white rounded-md shadow-lg shadow-blue-900/30 transition-colors"
          >
            {disabled ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Send className="h-5 w-5" />
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
