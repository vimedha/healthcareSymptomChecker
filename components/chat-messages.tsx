'use client'

import { Message } from './chat-interface'
import { Card } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { User, Bot, Clock, Image as ImageIcon } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { motion } from 'framer-motion'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Code } from 'lucide-react'

interface ChatMessagesProps {
  messages: Message[]
  isLoading: boolean
}

export function ChatMessages({ messages, isLoading }: ChatMessagesProps) {
  const formatTime = (timestamp: Date) => {
    return timestamp.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getContentIcon = (type: string) => {
    switch (type) {
      case 'image':
        return <ImageIcon className="h-3 w-3" />
      case 'audio':
        return <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
          <path d="M13 2a1 1 0 00-1 1v12a1 1 0 001 1h2a1 1 0 001-1V3a1 1 0 00-1-1h-2zM6 2a1 1 0 00-1 1v12a1 1 0 001 1h2a1 1 0 001-1V3a1 1 0 00-1-1H6zM19 10a1 1 0 10-2 0v3a1 1 0 102 0v-3z" />
        </svg>
      default:
        return null
    }
  }

  const MedicalCodeBlock = ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div className="relative bg-gray-900 border border-gray-700 rounded-lg p-4 my-4 overflow-x-auto">
      <div className="absolute top-2 right-2 flex items-center space-x-1 text-xs text-gray-400">
        <Code className="h-3 w-3" />
        <span className="ml-1">Code</span>
      </div>
      <pre className="text-sm text-gray-100 mt-2">
        <code>{children}</code>
      </pre>
    </div>
  )

 const MedicalLink: React.FC<React.AnchorHTMLAttributes<HTMLAnchorElement>> = (props) => (
  <a
    {...props}
    target="_blank"
    rel="noopener noreferrer"
    className={
      "text-blue-400 hover:text-blue-300 hover:underline transition-colors duration-200 " +
      (props.className || "")
    }
  >
    {props.children}
  </a>
)


  return (
    <div className="space-y-4">
      {messages.length === 0 && !isLoading && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center py-12 px-4"
        >
          <div className="bg-gradient-to-br from-blue-600 to-teal-600 rounded-full p-4 w-20 h-20 mx-auto mb-4 shadow-lg">
            <Bot className="h-8 w-8 text-white mx-auto" />
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">Welcome to HealthCheck AI</h3>
          <p className="text-gray-400 max-w-md mx-auto">
            Start by describing your symptoms or uploading an image. I'll help analyze and provide insights.
          </p>
        </motion.div>
      )}

      {messages.map((message) => (
        <motion.div
          key={message.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
        >
          <div className={`flex items-start space-x-3 max-w-3xl ${
            message.type === 'user' ? 'flex-row-reverse space-x-reverse' : ''
          }`}>
            <Avatar className="w-10 h-10 mt-1 flex-shrink-0">
              {message.type === 'user' ? (
                <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-600 text-white">
                  <User className="h-5 w-5" />
                </AvatarFallback>
              ) : (
                <AvatarFallback className="bg-gradient-to-r from-gray-600 to-gray-700 text-gray-300">
                  <Bot className="h-5 w-5" />
                </AvatarFallback>
              )}
            </Avatar>

            <div className={`rounded-2xl px-5 py-4 ${
              message.type === 'user' 
                ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-500/25' 
                : 'bg-gray-800 border border-gray-700 shadow-sm shadow-gray-800/50'
            } max-w-[85%]`}>
              
              {/* Content Type Badge */}
              {message.contentType !== 'text' && (
                <div className="flex items-center space-x-2 mb-3">
                  <Badge 
                    variant="secondary" 
                    className={`text-xs ${
                      message.type === 'user' ? 'bg-white/20 text-white' : 'bg-gray-700/50 text-gray-300'
                    } border-0`}
                  >
                    {getContentIcon(message.contentType)}
                    <span className="ml-1 capitalize">{message.contentType}</span>
                  </Badge>
                </div>
              )}

              {/* Transcription */}
              {message.transcription && (
                <div className={`mb-3 p-3 rounded-lg text-sm ${
                  message.type === 'user' 
                    ? 'bg-white/10' 
                    : 'bg-gray-700/50'
                } border ${
                  message.type === 'user' ? 'border-white/20' : 'border-gray-600/50'
                }`}>
                  <div className={`font-medium text-xs mb-1 ${
                    message.type === 'user' ? 'text-white/90' : 'text-gray-300'
                  }`}>
                    Transcription
                  </div>
                  <div className="text-xs italic whitespace-pre-wrap">
                    "{message.transcription}"
                  </div>
                </div>
              )}

              {/* Message Content */}
              {message.contentType === 'text' ? (
             <div className="prose prose-sm max-w-none break-words">
  <ReactMarkdown
    remarkPlugins={[remarkGfm]}
    components={{
      h1: ({ children }) => (
        <h1 className={`text-lg font-bold mb-2 ${
          message.type === 'user' ? 'text-white' : 'text-gray-100'
        }`}>
          {children}
        </h1>
      ),
      h2: ({ children }) => (
        <h2 className={`text-base font-semibold mt-4 mb-2 ${
          message.type === 'user' ? 'text-white' : 'text-gray-100'
        }`}>
          {children}
        </h2>
      ),
      h3: ({ children }) => (
        <h3 className={`text-sm font-semibold mt-3 mb-1 ${
          message.type === 'user' ? 'text-white' : 'text-gray-100'
        }`}>
          {children}
        </h3>
      ),
      p: ({ children }) => (
        <p className={`text-sm leading-relaxed mb-3 ${
          message.type === 'user' ? 'text-white/95' : 'text-gray-200'
        }`}>
          {children}
        </p>
      ),
      ul: ({ children }) => (
        <ul className="list-disc list-inside space-y-1 mb-3 ml-2">
          {children}
        </ul>
      ),
      ol: ({ children }) => (
        <ol className="list-decimal list-inside space-y-1 mb-3 ml-2">
          {children}
        </ol>
      ),
      li: ({ children }) => (
        <li className={`text-sm ${
          message.type === 'user' ? 'text-white/90' : 'text-gray-200'
        }`}>
          {children}
        </li>
      ),
      strong: ({ children }) => (
        <strong className="font-semibold">
          {children}
        </strong>
      ),
      em: ({ children }) => (
        <em className="italic">
          {children}
        </em>
      ),
      a: MedicalLink,
      code: ({ children, className }) => {
        if (className?.includes('language-')) {
          return (
            <MedicalCodeBlock className={className}>
              {children}
            </MedicalCodeBlock>
          )
        }
        return (
          <code className={`bg-gray-800/50 px-1.5 py-0.5 rounded text-xs font-mono ${
            message.type === 'user' ? 'text-blue-200' : 'text-blue-300'
          }`}>
            {children}
          </code>
        )
      },
      blockquote: ({ children }) => (
        <blockquote className={`border-l-4 pl-3 italic my-3 ${
          message.type === 'user' 
            ? 'border-blue-500 bg-blue-500/10' 
            : 'border-teal-500 bg-teal-500/10'
        }`}>
          {children}
        </blockquote>
      ),
      pre: ({ children }) => (
        <MedicalCodeBlock>
          {typeof children === 'string' ? children : (Array.isArray(children) ? children.join('') : '')}
        </MedicalCodeBlock>
      ),
      table: ({ children }) => (
        <div className="overflow-x-auto my-4">
          <table className={`min-w-full border-collapse border border-gray-600/50 rounded-lg ${
            message.type === 'user' 
              ? 'bg-blue-500/5' 
              : 'bg-gray-800/50'
          }`}>
            {children}
          </table>
        </div>
      ),
      th: ({ children }) => (
        <th className={`px-3 py-2 text-left font-semibold text-sm border border-gray-600/50 ${
          message.type === 'user' ? 'bg-blue-600/20 text-white' : 'bg-gray-700/50 text-gray-100'
        }`}>
          {children}
        </th>
      ),
      td: ({ children }) => (
        <td className={`px-3 py-2 text-sm border border-gray-600/50 ${
          message.type === 'user' ? 'text-white/90' : 'text-gray-200'
        }`}>
          {children}
        </td>
      ),
    }}
  >
    {message.content}
  </ReactMarkdown>
</div>

              ) : (
                <div className="text-sm whitespace-pre-wrap">
                  {message.content}
                </div>
              )}

              {/* Timestamp */}
              <div className={`flex items-center justify-${message.type === 'user' ? 'start' : 'end'} mt-3 text-xs opacity-70 pt-2 border-t ${
                message.type === 'user' 
                  ? 'border-white/20 text-white/70 justify-start' 
                  : 'border-gray-600/30 text-gray-400 justify-end'
              }`}>
                <Clock className="h-3 w-3 mr-1" />
                <span>{formatTime(message.timestamp)}</span>
              </div>
            </div>
          </div>
        </motion.div>
      ))}

      {/* Loading State */}
      {isLoading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex justify-start"
        >
          <div className="flex items-start space-x-3 max-w-3xl">
            <Avatar className="w-10 h-10 mt-1 flex-shrink-0">
              <AvatarFallback className="bg-gradient-to-r from-gray-600 to-gray-700 text-gray-300">
                <Bot className="h-5 w-5" />
              </AvatarFallback>
            </Avatar>
            
            <div className="rounded-2xl px-5 py-4 bg-gray-800 border border-gray-700 shadow-sm max-w-[85%]">
              <div className="flex space-x-2">
                {[...Array(3)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="w-2 h-2 bg-blue-400 rounded-full"
                    initial={{ opacity: 0 }}
                    animate={{ 
                      opacity: 1, 
                      scale: [1, 1.2, 1] 
                    }}
                    transition={{ 
                      duration: 1.4, 
                      repeat: Infinity, 
                      delay: i * 0.2 
                    }}
                  />
                ))}
              </div>
              <div className="flex items-center justify-end mt-3 text-xs text-gray-400 pt-2 border-t border-gray-600/30">
                <Clock className="h-3 w-3 mr-1" />
                <span>Analyzing symptoms...</span>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  )
}
