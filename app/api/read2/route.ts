import { NextRequest, NextResponse } from 'next/server'
import { PineconeClient } from '@pinecone-database/pinecone'
import { askAI, tts } from '../../../utils'
import { indexName } from '../../../config'



export async function POST(req: NextRequest) {
  const body = await req.json()

  const text = await askAI(body)

  const filename = await tts(`${text}`);

  return NextResponse.json({
    data: `${text}`,
    file: filename
  })
}