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
    <div className="space-y-6">
      {messages.length === 0 && !isLoading && (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Bot className="h-8 w-8 text-primary" />
          </div>
          <h3 className="text-xl font-semibold text-foreground mb-2">Ready to help!</h3>
          <p className="text-muted-foreground max-w-md mx-auto leading-relaxed">
            Start by describing your symptoms, uploading an image, or recording a voice message. 
            I&apos;ll analyze them with advanced AI technology.
          </p>
        </div>
      )}

      {messages.map((message) => (
        <motion.div
          key={message.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
        >
          <div className={`flex items-start space-x-3 max-w-3xl ${message.type === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
            <Avatar className="w-10 h-10 ring-2 ring-border">
              <AvatarFallback className={`${message.type === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                {message.type === 'user' ? <User className="h-5 w-5" /> : <Bot className="h-5 w-5" />}
              </AvatarFallback>
            </Avatar>
            
            <Card className={`p-5 ${message.type === 'user' ? 'bg-primary text-primary-foreground' : 'bg-card text-card-foreground'} border shadow-lg`}>
              {message.contentType !== 'text' && (
                <div className="flex items-center space-x-2 mb-3">
                  <Badge variant="secondary" className="text-xs font-medium">
                    {getContentIcon(message.contentType)}
                    <span className="ml-1 capitalize">{message.contentType}</span>
                  </Badge>
                </div>
              )}
              
              {message.transcription && (
                <div className="mb-3 p-3 bg-muted/50 rounded-lg text-sm italic border-l-2 border-primary">
                  <span className="font-medium text-muted-foreground">Transcription:</span> &quot;{message.transcription}&quot;
                </div>
              )}
              
              <div className="whitespace-pre-wrap leading-relaxed">{message.content}</div>
              
              <div className="flex items-center justify-end mt-3 text-xs opacity-60">
                <Clock className="h-3 w-3 mr-1" />
                {formatTime(message.timestamp)}
              </div>
            </Card>
          </div>
        </motion.div>
      ))}

      {isLoading && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="flex justify-start"
        >
          <div className="flex items-start space-x-3 max-w-3xl">
            <Avatar className="w-10 h-10 ring-2 ring-border">
              <AvatarFallback className="bg-muted text-muted-foreground">
                <Bot className="h-5 w-5" />
              </AvatarFallback>
            </Avatar>
            <Card className="p-5 bg-card border shadow-lg">
              <div className="flex items-center space-x-2">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                  <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                </div>
                <span className="text-sm text-muted-foreground">AI is thinking...</span>
              </div>
            </Card>
          </div>
        </motion.div>
      )}
    </div>
  )
}
