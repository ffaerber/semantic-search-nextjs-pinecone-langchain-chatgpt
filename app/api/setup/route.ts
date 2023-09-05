import { NextResponse } from 'next/server'
import { PineconeClient } from '@pinecone-database/pinecone'
import { TextLoader } from 'langchain/document_loaders/fs/text'
import { DirectoryLoader } from 'langchain/document_loaders/fs/directory'
import { PDFLoader } from 'langchain/document_loaders/fs/pdf'
import {
  createPineconeIndex,
  updatePinecone
} from '../../../utils'

import { indexName } from '../../../config'
import path from 'path'

export async function POST() {

  const documentsDirectory = path.join(process.cwd(), 'documents')

  const loader = new DirectoryLoader(documentsDirectory, {
    ".txt": (_path) => new TextLoader(_path),
    ".md": (_path) => new TextLoader(_path),
    ".pdf": (_path) => new PDFLoader(_path)
  })

  const docs = await loader.load()
  const vectorDimensions = 1536
  const client = new PineconeClient()
  await client.init({
    apiKey: process.env.PINECONE_API_KEY || '',
    environment: process.env.PINECONE_ENVIRONMENT || ''
  })

  try {
    await createPineconeIndex(client, indexName, vectorDimensions)
    await updatePinecone(client, indexName, docs)
  } catch (err) {
    console.log('error: ', err)
  }

  return NextResponse.json({
    data: 'successfully created index and loaded data into pinecone...'
  })
}