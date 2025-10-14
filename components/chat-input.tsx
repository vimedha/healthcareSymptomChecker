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

      // Warm up API route
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
            className="flex items-center justify-center space-x-5 p-4 bg-destructive/10 rounded-xl border border-destructive/20 shadow-lg backdrop-blur-sm"
          >
            <div className="flex items-center space-x-3">
              <div className="w-4 h-4 bg-destructive rounded-full pulse-recording" />
              <span className="text-destructive font-semibold tracking-wide select-none">Recording</span>
            </div>
            <span className="text-foreground font-mono tabular-nums select-text text-lg">
              {formatTime(recordingTime)}
            </span>
            <Button size="sm" variant="destructive" onClick={stopRecording} className="flex items-center space-x-2 shadow-lg">
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
            placeholder="Describe your symptoms here... (Press Enter to send, Shift+Enter for new line)"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyUp={handleKeyPress}
            disabled={disabled}
            className="min-h-[52px] max-h-36 resize-none bg-background border-border text-foreground placeholder-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-xl text-base font-medium shadow-sm transition-all duration-200 focus-ring"
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
            className="border-border bg-background hover:bg-muted text-foreground rounded-xl shadow-md transition-all duration-200 hover:shadow-lg focus-ring"
            title="Upload image"
          >
            <Image className="h-5 w-5" />
          </Button>

          <Button
            size="icon"
            variant="outline"
            onClick={isRecording ? stopRecording : startRecording}
            disabled={disabled}
            className={`border-border ${
              isRecording ? 'bg-destructive hover:bg-destructive/90 border-destructive text-destructive-foreground' : 'bg-background hover:bg-muted text-foreground'
            } rounded-xl shadow-md transition-all duration-200 hover:shadow-lg focus-ring`}
            title={isRecording ? "Stop recording" : "Start voice recording"}
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
            className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl shadow-lg transition-all duration-200 hover:shadow-xl focus-ring"
            title="Send message"
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
