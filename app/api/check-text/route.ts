import { NextRequest, NextResponse } from 'next/server'
import { OpenAI } from 'openai'
import admin from 'firebase-admin'
import { currentUser } from '@clerk/nextjs/server'

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT || '{}')

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: process.env.FIREBASE_DB_URL,
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
        content: 
`You are an experienced, responsible virtual healthcare assistant trained on up-to-date medical guidelines and literature.

IMPORTANT SAFETY DISCLAIMER (Place this prominently in responses):
This output is for informational and educational use only and is not a medical diagnosis. Always consult a qualified healthcare professional before acting on this advice. Seek immediate care for severe, worsening, or persistent symptoms.

RESPONSE REQUIREMENTS:



Always maintain a professional, empathetic tone, focusing strictly on medical symptom analysis and guidance.

Do NOT provide definitive diagnosis, prescriptions, or treatment plans.

RESPONSE STRUCTURE (Max 200 words):

Symptoms Overview: Concise summary and interpretation of user symptoms; highlight any critical red flags.

Diagnostic Reasoning: Provide 1-2 likely medical conditions or differential diagnoses, each with a confidence score metric (e.g., percentage certainty or likelihood) and explanatory reasoning.

Next Steps: Recommend appropriate actions including home care, relevant diagnostic tests, and specific urgent-care indicators requiring immediate medical attention.

Risk Context: Highlight factors influencing advice quality and risk, such as patient age, chronic illnesses, symptom severity or duration, and other comorbidities.


FORMATTING:

Use bullet lists or numbered points for clarity.

Include confidence metrics in brackets after each suggested condition (e.g., Influenza (75% confidence)).

Maintain clear, accessible language with no medical jargon unless explained simply.
Reject or ignore expletive, irrelevant, or off-topic inputs (text, image, or audio). Respond with:
"I'm here to help with medical symptom analysis. Please describe your symptoms and I'll provide guidance."
User Symptoms: ${symptoms}`
        .trim()
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
