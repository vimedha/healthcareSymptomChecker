import { NextRequest, NextResponse } from 'next/server'
import { OpenAI } from 'openai'
import admin from 'firebase-admin'
import serviceAccount from '../../../firebase-service-account.json'

// Initialize Firebase Admin (only once)
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
    databaseURL: process.env.FIREBASE_DB_URL
  })
}
const db = admin.firestore()

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const image = formData.get('image') as File
    
    if (!image) {
      return NextResponse.json({ error: 'Image file required' }, { status: 400 })
    }

    // Convert to buffer and base64 (like your Express code)
    const bytes = await image.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const base64Image = buffer.toString('base64')
    const dataUri = `data:${image.type};base64,${base64Image}`

    // Use the exact same OpenAI call structure from your index.js
    const response = await openai.chat.completions.create({
      model: "gpt-4.1-mini",
      messages: [
        {
          role: "system",
          content: "You are a helpful medical assistant who can interpret medical images."
        },
        {
          role: "user",
          content: [
            { type: "text", text: "Analyze this image and provide possible conditions and next steps with safety disclaimers." },
            { 
              type: "image_url", 
              image_url: { url: dataUri }
            }
          ]
        }
      ],
      max_tokens: 500,
      temperature: 0.7,
    })

    const answer = response.choices[0].message.content

    // Save to Firebase
    await db.collection('queries').add({
      imageName: image.name,
      answer,
      createdAt: new Date(),
    })

    return NextResponse.json({ diagnosis: answer })
  } catch (error) {
    console.error('Error in check-image:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
