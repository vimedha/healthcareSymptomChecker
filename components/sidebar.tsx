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
    <div className="w-80 border-r border-border bg-sidebar/50 backdrop-blur-sm">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-sidebar-foreground">Chat History</h2>
          <Badge variant="outline" className="text-xs">
            {chatHistory.length} conversations
          </Badge>
        </div>
        
        <ScrollArea className="h-[calc(100vh-200px)]">
          <div className="space-y-3">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="flex items-center space-x-2 text-muted-foreground">
                  <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-sm">Loading history...</span>
                </div>
              </div>
            ) : chatHistory.length === 0 ? (
              <div className="text-center py-8">
                <MessageCircle className="h-12 w-12 text-muted-foreground/50 mx-auto mb-3" />
                <p className="text-muted-foreground text-sm">No conversations yet</p>
                <p className="text-xs text-muted-foreground/70 mt-1">Start a conversation to see your history here</p>
              </div>
            ) : (
              chatHistory.map((chat) => (
                <Card key={chat.id} className="p-4 bg-card/50 border-border hover:bg-card/80 transition-all duration-200 cursor-pointer group hover:shadow-md">
                  <div className="flex items-start space-x-3">
                    <div className="text-primary mt-1 group-hover:scale-110 transition-transform duration-200">
                      {getIcon(chat.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-2">
                        <Badge variant="secondary" className="text-xs font-medium">
                          {chat.type}
                        </Badge>
                        <div className="flex items-center text-muted-foreground text-xs">
                          <Clock className="h-3 w-3 mr-1" />
                          {formatDate(chat.createdAt)}
                        </div>
                      </div>
                      <p className="text-sm text-foreground truncate mb-1 font-medium">
                        {chat.symptoms || chat.audioTranscription || chat.imageName || 'Image analysis'}
                      </p>
                      <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
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
