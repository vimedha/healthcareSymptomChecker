'use client'

import { UserButton, SignOutButton } from '@clerk/nextjs'
import { Activity, MessageSquare } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function Header() {
  return (
    <header className="h-16 border-b border-gray-700 bg-gray-800/50 backdrop-blur-sm">
      <div className="h-full px-6 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-600 rounded-lg">
            <Activity className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="font-semibold text-white">Healthcare AI</h1>
            <p className="text-xs text-gray-400">Symptom Checker</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 text-sm text-gray-300">
            <MessageSquare className="h-4 w-4" />
            <span>Chat Assistant</span>
          </div>
          <SignOutButton redirectUrl="/sign-in">
            <Button variant="outline" className="border-gray-600 bg-gray-800 hover:bg-gray-700 text-gray-200">
              Sign out
            </Button>
          </SignOutButton>
          <UserButton 
            appearance={{
              elements: {
                avatarBox: 'w-8 h-8',
                userButtonPopoverCard: 'bg-gray-800 border border-gray-700',
                userButtonPopoverText: 'text-white'
              }
            }}
          />
        </div>
      </div>
    </header>
  )
}
