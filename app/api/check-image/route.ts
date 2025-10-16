import { NextRequest, NextResponse } from 'next/server'
import { OpenAI } from 'openai'
import admin from 'firebase-admin'
import { currentUser } from '@clerk/nextjs/server'

if (!process.env.FIREBASE_SERVICE_ACCOUNT) {
  console.error('FIREBASE_SERVICE_ACCOUNT environment variable is not set')
  throw new Error('FIREBASE_SERVICE_ACCOUNT environment variable is required')
}

let serviceAccount
try {
  serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
} catch (error) {
  console.error('Failed to parse FIREBASE_SERVICE_ACCOUNT:', error)
  throw new Error('Invalid FIREBASE_SERVICE_ACCOUNT format. Ensure it\'s a valid JSON string')
}

if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
      databaseURL: process.env.FIREBASE_DB_URL,
    })
    console.log('Firebase Admin SDK initialized successfully')
  } catch (error) {
    console.error('Firebase Admin initialization failed:', error)
    throw error
  }
}

const db = admin.firestore()

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(request: NextRequest) {
  try {
    const clerkUser = await currentUser()
    if (!clerkUser?.id) {
      console.log('POST /api/check-image: No user authenticated')
      return NextResponse.json({ error: 'User authentication required' }, { status: 401 })
    }

    console.log('POST /api/check-image: Processing image for user', clerkUser.id)

    const formData = await request.formData()
    const image = formData.get('image')
    
    if (!image || !(image instanceof File)) {
      console.log('POST /api/check-image: Invalid image file')
      return NextResponse.json({ error: 'Image file required' }, { status: 400 })
    }

    console.log('POST /api/check-image: Image file received:', image.name, image.type)

    const bytes = await image.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const base64Image = buffer.toString('base64')
    const dataUri = `data:${image.type};base64,${base64Image}`

    console.log('POST /api/check-image: Base64 image created:', dataUri.substring(0, 100) + '...')

    console.log('POST /api/check-image: Sending to OpenAI for analysis')

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
            { type: "image_url", image_url: { url: dataUri } }
          ]
        }
      ],
      max_tokens: 500,
      temperature: 0.7,
    })

    const answer = response.choices[0].message.content
    const userId = clerkUser.id
    const userDiagnosisRef = db.collection(`users/${userId}/diagnosis`)

    console.log('POST /api/check-image: Saving to Firestore for user', userId)

    await userDiagnosisRef.add({
      symptoms: "image was submitted",
      imageName: image.name,
      imageData: dataUri,
      answer,
      type: "image",
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    })

    console.log('POST /api/check-image: Successfully saved image with ID:', image.name)

    return NextResponse.json({ diagnosis: answer, imageData: dataUri })
  } catch (error) {
    console.error('POST /api/check-image Error:', error)
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: typeof error === 'object' && error !== null && 'message' in error ? (error as { message: string }).message : String(error)
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    console.log('GET /api/check-image: Attempting to retrieve image')
    
    const clerkUser = await currentUser()
    if (!clerkUser?.id) {
      console.log('GET /api/check-image: No user authenticated')
      return NextResponse.json({ error: 'User authentication required' }, { status: 401 })
    }

    const url = new URL(request.url)
    const imageName = url.searchParams.get("imageName")
    
    console.log('GET /api/check-image: Looking for imageName:', imageName)

    if (!imageName) {
      console.log('GET /api/check-image: Missing imageName parameter')
      return NextResponse.json({ error: 'Missing imageName parameter' }, { status: 400 })
    }

    const userId = clerkUser.id
    const userDiagnosisRef = db.collection(`users/${userId}/diagnosis`)
    
    console.log('GET /api/check-image: Querying Firestore for user', userId)

    const snapshot = await userDiagnosisRef
      .where('imageName', '==', imageName)
      .where('type', '==', 'image')
      .limit(1)
      .get()

    if (snapshot.empty) {
      console.log('GET /api/check-image: No image found for imageName:', imageName)
      return NextResponse.json({ error: 'Image not found' }, { status: 404 })
    }

    const doc = snapshot.docs[0].data()
    console.log('GET /api/check-image: Found image for user', userId, 'with name:', imageName)

    return NextResponse.json({
      success: true,
      imageData: doc.imageData,
      diagnosis: doc.answer,
      imageName: doc.imageName,
      createdAt: doc.createdAt,
      messageId: snapshot.docs[0].id
    })
  } catch (error) {
    console.error('GET /api/check-image Error:', error)
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: typeof error === 'object' && error !== null && 'message' in error ? (error as { message: string }).message : String(error)
    }, { status: 500 })
  }
}
