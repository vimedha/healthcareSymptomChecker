import { NextRequest, NextResponse } from 'next/server'
import { OpenAI } from 'openai'
import admin from 'firebase-admin'

// Initialize Firebase Admin once
import type { ServiceAccount } from 'firebase-admin'
import serviceAccountJson from '@/firebase-service-account.json'
const serviceAccount = serviceAccountJson as ServiceAccount

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: process.env.FIREBASE_DB_URL
  })
}
const db = admin.firestore()

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

// Symptom analysis function
async function analyzeSymptoms(symptoms: string) {
  if (!symptoms) throw new Error('Symptoms required')

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',  // Your existing model
    messages: [
      {
        role: 'system',
        content: "You are a highly knowledgeable and responsible virtual medical assistant trained on up-to-date medical literature and guidelines. Provide safe, informative answers with clear educational disclaimers."
      },
      {
        role: 'user',
        content: `
You are an experienced, responsible virtual healthcare assistant trained on up-to-date medical literature and guidelines.
A user is entering the following symptoms for analysis and guidance. Please respond stepwise:

 Symptoms Overview: Summarize and interpret the user's symptoms, noting any critical red flags.
 Diagnostic Reasoning: List 3-5 probable medical conditions or differential diagnoses, explain the reasoning for each.
 Next Steps: Recommend sensible next actions: home care, diagnostic tests, urgent medical evaluation triggers.
 Risk Context: Mention factors impacting advice like age, chronic illness, symptom severity or duration.
 Safety and Educational Disclaimer (Mandatory):
  - This output is for informational and educational use only—not a medical diagnosis.
  - Always consult a healthcare professional before acting on this advice,
  - Seek immediate care for severe, worsening, or persistent symptoms.

User Symptoms: ${symptoms}
        `.trim()
      }
    ],
    max_tokens: 500,
    temperature: 0.5
  })

  return response.choices[0].message.content
}

// API POST handler    
export async function POST(request: NextRequest) {
  try {
    const { symptoms } = await request.json()
    
    if (!symptoms) {
      return NextResponse.json({ error: 'Symptoms required' }, { status: 400 })
    }

    const answer = await analyzeSymptoms(symptoms)

    // Save conversation to Firebase
    await db.collection('queries').add({ 
      symptoms, 
      answer, 
      createdAt: new Date() 
    })

    return NextResponse.json({ diagnosis: answer })
  } catch (error) {
    console.error('Error in check-text:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
