'use client'
import { SignOutButton, useUser } from '@clerk/nextjs'
import DashboardPage from './dashboard/page'

export default function HomePage() {
  const { user } = useUser()

  return (
    <div className="min-h-screen w-full bg-gradient-to-tr from-blue-900 via-cyan-900 to-blue-700 
                bg-[length:200%_200%] animate-gradient-x transition-colors duration-100">
      <div className="fixed top-2 right-2 z-50">
        <SignOutButton redirectUrl="/sign-in">
          {user?.imageUrl ? (
            <img
              src={user.imageUrl}
              alt={`${user.firstName}'s profile`}
              className="w-8 h-8 rounded-full cursor-pointer border border-gray-600"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-white text-xs font-semibold cursor-pointer">
              {user?.firstName?.[0] || 'U'}
            </div>
          )}
        </SignOutButton>
      </div>
      <DashboardPage />
    </div>
  )
}
