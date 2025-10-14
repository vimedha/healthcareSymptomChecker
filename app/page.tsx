import { SignOutButton } from '@clerk/nextjs'
import { Button } from '@/components/ui/button'
import DashboardPage from './(dashboard)/page'

export default function HomePage() {
  return (
    <>
      <div className="absolute top-4 right-4 z-50">
        <SignOutButton redirectUrl="/sign-in">
          <Button variant="outline" className="border-gray-600 bg-gray-800 hover:bg-gray-700 text-gray-200">
            Sign out
          </Button>
        </SignOutButton>
      </div>
      <DashboardPage />
    </>
  )
}
