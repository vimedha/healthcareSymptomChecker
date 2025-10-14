'use client'

import { useState, useEffect } from 'react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { MessageCircle, Clock, Image, Mic } from 'lucide-react'
import { useUser } from '@clerk/nextjs'
import { db } from '@/lib/firebase'
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore'

interface ChatHistory {
  id: string
  symptoms?: string
  audioTranscription?: string
  imageName?: string
  answer: string
  createdAt: Date
  type: 'text' | 'audio' | 'image'
}

export function Sidebar() {
  useUser()
  const [chatHistory, setChatHistory] = useState<ChatHistory[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const q = query(collection(db, 'queries'), orderBy('createdAt', 'desc'))
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items: ChatHistory[] = snapshot.docs.map((doc) => {
        const data = doc.data() as any
        const createdAt = data.createdAt?.toDate ? data.createdAt.toDate() : new Date()
        let type: 'text' | 'audio' | 'image' = 'text'
        if (data.audioTranscription) type = 'audio'
        else if (data.imageName) type = 'image'

        return {
          id: doc.id,
          symptoms: data.symptoms,
          audioTranscription: data.audioTranscription,
          imageName: data.imageName,
          answer: data.answer ?? data.diagnosis ?? '',
          createdAt,
          type,
        }
      })
      setChatHistory(items)
      setLoading(false)
    }, (err) => {
      console.error('Error fetching chat history:', err)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  const getIcon = (type: string) => {
    switch (type) {
      case 'audio':
        return <Mic className="h-4 w-4" />
      case 'image':
        return <Image className="h-4 w-4" />
      default:
        return <MessageCircle className="h-4 w-4" />
    }
  }

  const formatDate = (date: Date | string | number) => {
    const d = new Date(date)
    return d.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="w-80 border-r border-gray-700 bg-gray-800/30 backdrop-blur-sm">
      <div className="p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Chat History</h2>
        
        <ScrollArea className="h-[calc(100vh-160px)]">
          <div className="space-y-3">
            {loading ? (
              <div className="text-gray-400 text-sm">Loading history...</div>
            ) : chatHistory.length === 0 ? (
              <div className="text-gray-400 text-sm">No conversations yet</div>
            ) : (
              chatHistory.map((chat) => (
                <Card key={chat.id} className="p-4 bg-gray-700/50 border-gray-600 hover:bg-gray-700/70 transition-colors cursor-pointer">
                  <div className="flex items-start space-x-3">
                    <div className="text-blue-400 mt-1">
                      {getIcon(chat.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-2">
                        <Badge variant="secondary" className="text-xs">
                          {chat.type}
                        </Badge>
                        <div className="flex items-center text-gray-400 text-xs">
                          <Clock className="h-3 w-3 mr-1" />
                          {formatDate(chat.createdAt)}
                        </div>
                      </div>
                      <p className="text-sm text-gray-300 truncate mb-1">
                        {chat.symptoms || chat.audioTranscription || chat.imageName || 'Image analysis'}
                      </p>
                      <p className="text-xs text-gray-400 line-clamp-2">
                        {chat.answer.substring(0, 80)}...
                      </p>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  )
}
