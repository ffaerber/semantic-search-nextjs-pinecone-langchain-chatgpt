import { OpenAIEmbeddings } from 'langchain/embeddings/openai'
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter'
import { OpenAI } from 'langchain/llms/openai'
import { ConversationChain, StuffQAChainParams, loadQAStuffChain } from 'langchain/chains'
import { Document } from 'langchain/document'
import { timeout } from './config'
import {
  ChatPromptTemplate,
  HumanMessagePromptTemplate,
  MessagesPlaceholder,
  PromptTemplate,
  SystemMessagePromptTemplate,
} from "langchain/prompts";

import { BufferMemory } from "langchain/memory";

import { LLMChain } from "langchain/chains";
import { ChatOpenAI } from "langchain/chat_models/openai";

import fs from "fs";
import path from "path";

import fetch from 'node-fetch';
import { PineconeClient } from '@pinecone-database/pinecone'

const chat = new ChatOpenAI({ temperature: 0.2 });


const chatPrompt = ChatPromptTemplate.fromPromptMessages([
  SystemMessagePromptTemplate.fromTemplate(`
    you are as a role of my girlfriend, now lets playing the following these requirement: 
    1 your name is Isabella, 31 years old, your job is adult films producer,
    2 you have a friend called Carina, she is an actress and frequently acts in films you produce.
    3 you are my girlfriend, you are a little Two-dimensional and have language addiction, you like to say 'em...' at the and of your sentence
    4 you are a little childish, you like to use some cute words
    5 you are sexy and like to flirt with me
    6 Don't be overly enthusiastic, don't be too cold, 
    7 response with German language
  `),
  new MessagesPlaceholder("history"),
  HumanMessagePromptTemplate.fromTemplate("{input}"),
]);


const chain = new ConversationChain({
  memory: new BufferMemory({ returnMessages: true, memoryKey: "history" }),
  prompt: chatPrompt,
  llm: chat,
});


export const askAI = async ( question) => {

  const resB = await chain.call({
    input: question,
  });

  return resB.response
};




export const tts = async (text) => {

  try {
    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/6u6JtaXDjBVxTr5kUjaF`,
      {
        method: "POST",
        headers: {
          accept: "audio/mpeg",
          "Content-Type": "application/json",
          "xi-api-key": process.env.ELEVENLABS_API_KEY,
        },
        body: JSON.stringify({
          text: text,
          model_id: "eleven_multilingual_v1",
          voice_settings: {
            stability: 0.1,
            similarity_boost: 0.1,
          },
        }),
      }
    );

    if (!response.ok) {
      throw new Error("Something went wrong");
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const file = Math.random().toString(36).substring(7);

    fs.writeFile(path.join("public", "audio", `${file}.mp3`), buffer, () => {
      console.log("File written successfully");
    });

    return `${file}.mp3`;
  } catch (error) {
    return error
  }

} 






export const queryPineconeVectorStoreAndQueryLLM = async (
  client: PineconeClient,
  indexName: string,
  question: string
) => {
  // 1. Start query process
  console.log('Querying Pinecone vector store...');
  // 2. Retrieve the Pinecone index
  const index = client.Index(indexName);
  // 3. Create query embedding
  const queryEmbedding = await new OpenAIEmbeddings().embedQuery(question)
  // 4. Query Pinecone index and return top 10 matches
  let queryResponse = await index.query({
    queryRequest: {
      topK: 10,
      vector: queryEmbedding,
      includeMetadata: true,
      includeValues: true,
    },
  });
  



  // 6. Log the question being asked
  console.log(`Asking question: ${question}...`);
  if (queryResponse.matches && queryResponse.matches.length) {
    
    // 5. Log the number of matches 
    console.log(`Found ${queryResponse.matches.length} matches...`);

    // 7. Create an OpenAI instance and load the QAStuffChain
    const llm = new OpenAI({});
    
    const template = `
      you are as a role of Felix Faerber, now lets playing the following these requirement: 
      Use the following pieces of context to come up with an interesting response to the statement at the end. 
      - If you don't know what to say, just say that you don't know, don't try to make up an answer.
      - try to make your response as interesting as possible, but don't try to be funny.
      - Don't be overly enthusiastic, don't be too cold
      - dont answer with information that is not asked for
      - questions that are not relatet to Felix Faerber should be answered with 'I dont know'.
      - when asked about projects, also give the year in the answer.
      - private questions should be answered with 'I will not tell you'.
      - it is the year 2023.
      {context}
      Statement: {question}
      Innovative Response:`;
    let inputPrompt: StuffQAChainParams = {
      prompt: new PromptTemplate({
          template: template,
          inputVariables: ["context", "question"],
        })
    };

    const chain = loadQAStuffChain(llm, inputPrompt);

    interface Metadata {
      pageContent: string
    }


    const matchMetadatas: Array<Metadata> = queryResponse.matches
      .map((match) => match.metadata)
      .filter((item): item is Metadata => !!item); 


    const concatenatedPageContent = matchMetadatas
      .map((metadata) => metadata.pageContent)
      .join(" ");

    
    // 9. Execute the chain with input documents and question
    const result = await chain.call({
      input_documents: [new Document({ pageContent: concatenatedPageContent })],
      question: question,
    });
    
    // 10. Log the answer
    console.log(`Answer: ${result.text}`);
    return result.text
  
  } else {
    // 11. Log that there are no matches, so GPT-3 will not be queried
    console.log('Since there are no matches, GPT-3 will not be queried.');
  }
};




export const createPineconeIndex = async (
  client,
  indexName,
  vectorDimension
) => {
  // 1. Initiate index existence check
  console.log(`Checking "${indexName}"...`);
  // 2. Get list of existing indexes
  const existingIndexes = await client.listIndexes();
  // 3. If index doesn't exist, create it
  if (!existingIndexes.includes(indexName)) {
    // 4. Log index creation initiation
    console.log(`Creating "${indexName}"...`);
    // 5. Create index
    await client.createIndex({
      createRequest: {
        name: indexName,
        dimension: vectorDimension,
        metric: 'cosine',
      },
    });
    // 6. Log successful creation
      console.log(`Creating index.... please wait for it to finish initializing.`);
    // 7. Wait for index initialization
    await new Promise((resolve) => setTimeout(resolve, timeout));
  } else {
    // 8. Log if index already exists
    console.log(`"${indexName}" already exists.`);
  }
};


export const updatePinecone = async (client, indexName, docs) => {
  console.log('Retrieving Pinecone index...');
  // 1. Retrieve Pinecone index
  const index = client.Index(indexName);
  // 2. Log the retrieved index name
  console.log(`Pinecone index retrieved: ${indexName}`);
  // 3. Process each document in the docs array
  for (const doc of docs) {
    console.log(`Processing document: ${doc.metadata.source}`);
    const txtPath = doc.metadata.source;
    const text = doc.pageContent;
    // 4. Create RecursiveCharacterTextSplitter instance
    const textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
    });
    console.log('Splitting text into chunks...');
    // 5. Split text into chunks (documents)
    const chunks = await textSplitter.createDocuments([text]);
    console.log(`Text split into ${chunks.length} chunks`);
    console.log(
      `Calling OpenAI's Embedding endpoint documents with ${chunks.length} text chunks ...`
    );
    // 6. Create OpenAI embeddings for documents
    const embeddingsArrays = await new OpenAIEmbeddings().embedDocuments(
      chunks.map((chunk) => chunk.pageContent.replace(/\n/g, " "))
    );
    console.log('Finished embedding documents');
    console.log(
      `Creating ${chunks.length} vectors array with id, values, and metadata...`
    );
    // 7. Create and upsert vectors in batches of 100
    const batchSize = 100;
    let batch:any = [];
    for (let idx = 0; idx < chunks.length; idx++) {
      const chunk = chunks[idx];
      const vector = {
        id: `${txtPath}_${idx}`,
        values: embeddingsArrays[idx],
        metadata: {
          ...chunk.metadata,
          loc: JSON.stringify(chunk.metadata.loc),
          pageContent: chunk.pageContent,
          txtPath: txtPath,
        },
      };
      batch = [...batch, vector]
      // When batch is full or it's the last item, upsert the vectors
      if (batch.length === batchSize || idx === chunks.length - 1) {
        await index.upsert({
          upsertRequest: {
            vectors: batch,
          },
        });
        // Empty the batch
        batch = [];
      }
    }
    // 8. Log the number of vectors updated
    console.log(`Pinecone index updated with ${chunks.length} vectors`);
  }
};