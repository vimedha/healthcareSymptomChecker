import { NextRequest, NextResponse } from 'next/server'
import { OpenAI } from 'openai'
import admin from 'firebase-admin'
import { currentUser } from '@clerk/nextjs/server'
import serviceAccount from '../../../firebase-service-account.json'

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
    databaseURL: process.env.FIREBASE_DB_URL
  })
}
const db = admin.firestore()

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(request: NextRequest) {
  try {
    const clerkUser = await currentUser()
    if (!clerkUser?.id) {
      return NextResponse.json({ error: 'User authentication required' }, { status: 401 })
    }

    const formData = await request.formData()
    const image = formData.get('image') as File
    if (!image) {
      return NextResponse.json({ error: 'Image file required' }, { status: 400 })
    }

    const bytes = await image.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const base64Image = buffer.toString('base64')
    const dataUri = `data:${image.type};base64,${base64Image}`

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
    const userId = clerkUser.id
    const userDiagnosisRef = db.collection(`users/${userId}/diagnosis`)

    await userDiagnosisRef.add({
      symptoms: "image was submitted",
      imageName: image.name,
      imageData: dataUri,
      answer,
      type: "image",
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    })

    return NextResponse.json({ diagnosis: answer, imageData: dataUri })
  } catch (error) {
    console.error('Error in check-image:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
