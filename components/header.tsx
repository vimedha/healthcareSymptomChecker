'use client'

import { UserButton, SignOutButton } from '@clerk/nextjs'
import { Activity, MessageSquare, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

export function Header() {
  return (
    <header className="h-16 border-b border-border bg-card/50 backdrop-blur-md shadow-sm">
      <div className="h-full max-w-7xl mx-auto px-6 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="p-2.5 bg-primary rounded-xl shadow-lg ring-1 ring-primary/20">
            <Activity className="h-6 w-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="font-bold text-foreground text-lg md:text-xl leading-tight flex items-center gap-2">
              Healthcare AI
              <Badge variant="secondary" className="text-xs px-2 py-0.5">
                <Sparkles className="h-3 w-3 mr-1" />
                AI-Powered
              </Badge>
            </h1>
            <p className="text-xs md:text-sm text-muted-foreground tracking-wide">
              Intelligent Symptom Analysis
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 text-sm text-muted-foreground select-none px-3 py-2 rounded-lg bg-muted/50">
            <MessageSquare className="h-4 w-4" />
            <span className="font-medium">AI Assistant</span>
          </div>
          <SignOutButton redirectUrl="/sign-in">
            <Button
              variant="outline"
              size="sm"
              className="border-border bg-background hover:bg-muted text-foreground transition-all duration-200 shadow-sm hover:shadow-md"
            >
              Sign out
            </Button>
          </SignOutButton>
          <UserButton
            appearance={{
              elements: {
                avatarBox: 'w-9 h-9 rounded-full ring-2 ring-primary/20 hover:ring-primary/40 transition-all duration-200',
                userButtonPopoverCard: 'bg-card border border-border shadow-xl backdrop-blur-md',
                userButtonPopoverText: 'text-foreground',
                userButtonPopoverActions: 'text-muted-foreground',
              },
            }}
          />
        </div>
      </div>
    </header>
  )
}
