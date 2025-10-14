import { NextRequest, NextResponse } from 'next/server'
import { OpenAI } from 'openai'
import admin from 'firebase-admin'
import serviceAccount from '../../../firebase-service-account.json'

// Initialize Firebase Admin once
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
    databaseURL: process.env.FIREBASE_DB_URL,
  })
}
const db = admin.firestore()

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const audio = formData.get('audio') as File

    if (!audio) {
      return NextResponse.json({ error: 'Audio file required' }, { status: 400 })
    }

    console.log("Audio file received:", audio.name, "size:", audio.size)

    const bytes = await audio.arrayBuffer()
    const buffer = Buffer.from(bytes)

    const audioFile = new File([buffer], audio.name || 'audio.wav', {
      type: audio.type || 'audio/wav',
    })

    console.log("Converted file:", { name: audioFile.name, size: audioFile.size })

    // Use the correct Whisper model name
    const transcribedText = await openai.audio.transcriptions.create({
      file: audioFile,
      model: 'whisper-1', // Correct model name
      response_format: 'text',
    }) as string

    if (!transcribedText || transcribedText.trim() === '') {
      console.error("No text returned from transcription.")
      return NextResponse.json({ error: "Could not transcribe audio" }, { status: 500 })
    }

    console.log("Transcribed text:", transcribedText)

    // Forward transcription to check-text API
    const baseUrl = new URL(request.url)
    baseUrl.pathname = '/api/check-text'
    
    const cookies = request.headers.get('cookie') ?? ''
    let answer: string | null = null
    try {
      const forward = await fetch(baseUrl.toString(), {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'cookie': cookies // pass session cookies for auth
        },
        body: JSON.stringify({ symptoms: transcribedText }),
      })

      if (!forward.ok) {
        console.error("Failed to forward to check-text API:", forward.status)
      } else {
        const json = await forward.json()
        answer = json?.diagnosis ?? null
      }
    } catch (forwardError) {
      console.error("Error forwarding to check-text API:", forwardError)
      answer = null
    }

    // Save to Firebase
    await db.collection('queries').add({
      audioTranscription: transcribedText,
      answer: answer ?? '', 
      createdAt: new Date(),
    })

    return NextResponse.json({ 
      transcription: transcribedText, 
      diagnosis: answer 
    })

  } catch (error) {
    console.error("Error in stream-audio:", error)
    return NextResponse.json({
      error: "Internal server error",
      message: error instanceof Error ? error.message : "Unknown error",
    }, { status: 500 })
  }
}
