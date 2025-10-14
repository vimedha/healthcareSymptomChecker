'use client'

import { Message } from './chat-interface'
import { Card } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { User, Bot, Clock, Image as ImageIcon } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { motion } from 'framer-motion'

interface ChatMessagesProps {
  messages: Message[]
  isLoading: boolean
}

export function ChatMessages({ messages, isLoading }: ChatMessagesProps) {
  const formatTime = (timestamp: Date) => {
    return timestamp.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  }

  const getContentIcon = (type: string) => {
    switch (type) {
      case 'image':
        return <ImageIcon className="h-3 w-3" />
      default:
        return null
    }
  }

  return (
    <div className="space-y-4">
      {messages.length === 0 && !isLoading && (
        <div className="text-center py-8">
          <Bot className="h-12 w-12 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400">Start by describing your symptoms or uploading an image.</p>
        </div>
      )}

      {messages.map((message) => (
        <motion.div
          key={message.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
        >
          <div className={`flex items-start space-x-3 max-w-3xl ${message.type === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
            <Avatar className="w-8 h-8">
              <AvatarFallback className={`${message.type === 'user' ? 'bg-blue-600' : 'bg-gray-600'}`}>
                {message.type === 'user' ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
              </AvatarFallback>
            </Avatar>
            
            <Card className={`p-4 ${message.type === 'user' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-100'} border-0`}>
              {message.contentType !== 'text' && (
                <div className="flex items-center space-x-2 mb-2">
                  <Badge variant="secondary" className="text-xs">
                    {getContentIcon(message.contentType)}
                    <span className="ml-1 capitalize">{message.contentType}</span>
                  </Badge>
                </div>
              )}
              
              {message.transcription && (
                <div className="mb-2 p-2 bg-gray-600/50 rounded text-sm italic">
                  Transcription: &quot;{message.transcription}&quot;
                </div>
              )}
              
              <div className="whitespace-pre-wrap">{message.content}</div>
              
              <div className="flex items-center justify-end mt-2 text-xs opacity-70">
                <Clock className="h-3 w-3 mr-1" />
                {formatTime(message.timestamp)}
              </div>
            </Card>
          </div>
        </motion.div>
      ))}

      {isLoading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex justify-start"
        >
          <div className="flex items-start space-x-3 max-w-3xl">
            <Avatar className="w-8 h-8">
              <AvatarFallback className="bg-gray-600">
                <Bot className="h-4 w-4" />
              </AvatarFallback>
            </Avatar>
            <Card className="p-4 bg-gray-700 border-0">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
              </div>
            </Card>
          </div>
        </motion.div>
      )}
    </div>
  )
}
