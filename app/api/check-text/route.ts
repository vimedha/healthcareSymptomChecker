import { NextRequest, NextResponse } from 'next/server'
import { OpenAI } from 'openai'
import admin from 'firebase-admin'
import { currentUser } from '@clerk/nextjs/server' 


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


const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

async function analyzeSymptoms(symptoms: string) {
  if (!symptoms) throw new Error('Symptoms required')

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: "You are a highly knowledgeable and responsible virtual medical assistant trained on up-to-date medical literature and guidelines. Provide safe, informative answers with clear educational disclaimers."
      },
      {
        role: 'user',
        content: `
You are an experienced, responsible virtual healthcare assistant trained on up-to-date medical literature and guidelines.
A user is entering the following symptoms for analysis and guidance, do not exceed the word limit of 200. Please respond stepwise:

Symptoms Overview: Summarize and interpret the user's symptoms, noting any critical red flags.
Diagnostic Reasoning: List 1-2 probable medical conditions or differential diagnoses, explain the reasoning for each.
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


export async function POST(request: NextRequest) {
  try {

    const clerkUser = await currentUser()
    
    if (!clerkUser?.id) {
      return NextResponse.json({ error: 'User authentication required' }, { status: 401 })
    }

    const { symptoms } = await request.json()
    
    if (!symptoms) {
      return NextResponse.json({ error: 'Symptoms required' }, { status: 400 })
    }

    
    const answer = await analyzeSymptoms(symptoms)

    
    const userId = clerkUser.id
    const userDiagnosisRef = db.collection(`users/${userId}/diagnosis`)
    
    await userDiagnosisRef.add({ 
      symptoms, 
      answer, 
      type: "text",
      createdAt: admin.firestore.FieldValue.serverTimestamp(), 
    })

    console.log(`Diagnosis saved for user ${userId} in users/${userId}/diagnosis`)

   
    return NextResponse.json({ 
      diagnosis: answer,
  
      debug: {
        userId: userId,
        savedTo: `users/${userId}/diagnosis`,
      }
    })
    
  } catch (error) {
    console.error('Error in check-text:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
