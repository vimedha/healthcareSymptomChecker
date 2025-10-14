import { SignIn } from '@clerk/nextjs'

export default function SignInPage() {
  return (
    <div className="flex flex-col items-center space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-white mb-2">
          Healthcare Symptom Checker
        </h1>
        <p className="text-gray-300">
          Sign in to start your health consultation
        </p>
      </div>
      <SignIn 
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
