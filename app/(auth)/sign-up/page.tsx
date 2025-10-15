import { SignUp } from '@clerk/nextjs'

export default function SignUpPage() {
  return (
    <div className="flex flex-col items-center space-y-4 space-x-4">
      <div className="text-center">
        <h1 className="text-xl font-medium text-white mb-1">
          Sign Up at Arogya AI
        </h1>
        <p className="text-gray-300 text-sm">
          Create an account to access AI-powered health insights
        </p>
      </div>
      <SignUp 
        routing="hash"
        appearance={{
          elements: {
            formButtonPrimary: 'bg-blue-600 hover:bg-blue-700',
            card: 'bg-gray-800 border border-gray-700',
            headerTitle: 'text-white',
            headerSubtitle: 'text-gray-300',
            socialButtonsBlockButton: 'border-gray-600 hover:bg-gray-700',
            formFieldInput: 'bg-gray-900 border-gray-600 text-white',
            formFieldLabel: 'text-gray-300',
            footerActionLink: 'text-blue-400 hover:text-blue-300'
          }
        }}
      />
    </div>
  )
}
