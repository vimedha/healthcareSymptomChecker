import { SignIn } from '@clerk/nextjs'

export default function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center fade-in">
          <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <span className="text-3xl">🏥</span>
          </div>
          <h1 className="text-4xl font-bold text-foreground mb-3">
            Healthcare AI
          </h1>
          <p className="text-muted-foreground text-lg leading-relaxed">
            Sign in to access your AI-powered health assistant
          </p>
        </div>
        
        <div className="slide-in">
          <SignIn 
            routing="hash"
            appearance={{
              elements: {
                formButtonPrimary: 'bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg transition-all duration-200',
                card: 'bg-card border border-border shadow-xl backdrop-blur-sm',
                headerTitle: 'text-foreground font-bold text-2xl',
                headerSubtitle: 'text-muted-foreground',
                socialButtonsBlockButton: 'border-border hover:bg-muted transition-all duration-200',
                formFieldInput: 'bg-background border-border text-foreground focus:border-primary focus:ring-2 focus:ring-primary/20',
                formFieldLabel: 'text-foreground font-medium',
                footerActionLink: 'text-primary hover:text-primary/80 transition-colors duration-200'
              }
            }}
          />
        </div>
      </div>
    </div>
  )
}
