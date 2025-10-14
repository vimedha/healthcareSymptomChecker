'use client'

import { UserButton, SignOutButton } from '@clerk/nextjs'
import { Activity, MessageSquare } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function Header() {
  return (
    <header className="h-16 border-b border-gray-700 bg-gray-900/70 backdrop-blur-md shadow-lg">
      <div className="h-full max-w-7xl mx-auto px-6 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="p-2 bg-blue-600 rounded-lg shadow">
            <Activity className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="font-semibold text-white text-lg md:text-xl leading-tight">
              Healthcare AI
            </h1>
            <p className="text-xs md:text-sm text-gray-400 tracking-wide">
              Symptom Checker
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-2 text-sm text-gray-300 select-none">
            <MessageSquare className="h-5 w-5" />
            <span>Chat Assistant</span>
          </div>
          <SignOutButton redirectUrl="/sign-in">
            <Button
              variant="outline"
              className="border-gray-600 bg-gray-800 hover:bg-gray-700 text-gray-200 transition-colors duration-200 shadow-sm"
            >
              Sign out
            </Button>
          </SignOutButton>
          <UserButton
            appearance={{
              elements: {
                avatarBox: 'w-9 h-9 rounded-full ring-1 ring-blue-500',
                userButtonPopoverCard: 'bg-gray-900 border border-gray-700 shadow-lg',
                userButtonPopoverText: 'text-white',
                userButtonPopoverActions: 'text-gray-300',
              },
            }}
          />
        </div>
      </div>
    </header>
  )
}
