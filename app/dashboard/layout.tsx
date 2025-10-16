import { ReactNode } from 'react'
import Link from 'next/link'

interface DashboardLayoutProps {
  children: ReactNode
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-900">
      
      <header className="bg-gradient-to-r from-blue-900 to-purple-900 border-b border-gray-700">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/dashboard" className="text-2xl font-bold text-white">
                Dashboard
              </Link>
              <nav className="hidden md:flex space-x-6">
                <Link 
                  href="/dashboard/resumes" 
                  className="text-blue-200 hover:text-white transition-colors"
                >
                  Resumes
                </Link>
                <Link 
                  href="/dashboard/editor" 
                  className="text-purple-200 hover:text-white transition-colors"
                >
                  Editor
                </Link>
                <Link 
                  href="/" 
                  className="text-green-200 hover:text-green-100 transition-colors"
                >
                  Health AI
                </Link>
              </nav>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/" className="text-sm bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors">
                Health Symptom Checker
              </Link>
            </div>
          </div>
        </div>
      </header>

  
      <main className="max-w-6xl mx-auto px-4 py-8">
        {children}
      </main>

     
      <footer className="border-t border-gray-700 bg-gray-800/50 mt-12">
        <div className="max-w-6xl mx-auto px-4 py-6 text-center text-gray-400 text-sm">
          © 2025 Healthcare Symptom Checker. All rights reserved.
        </div>
      </footer>
    </div>
  )
}
