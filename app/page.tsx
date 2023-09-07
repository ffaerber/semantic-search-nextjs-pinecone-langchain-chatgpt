'use client'
import { useState } from 'react'
import { Public_Sans } from 'next/font/google'
 
const publicSans = Public_Sans({
  weight: '400',
  subsets: ['latin'],
})
 
interface MessageType {
  text: string;
  type: 'question' | 'answer';
  date: number;
}


const Message: React.FC<MessageType> = (msg) => {
  
  let style = ''
  if(msg.type === 'question') {
    style = 'rounded-br-none bg-[#FFA6F6]'
  }else {
    style = 'rounded-bl-none bg-[#00E1EF] text-gray-600'
  }

  return (

    <div className="chat-message">
      <div className={`flex items-end ${ msg.type === 'answer' ? '' : 'justify-end' }`}>
          <div className="flex flex-col space-y-2 text-xs max-w-xs mx-2 order-1 items-end ">
            <div><span className={`${publicSans.className} px-4 py-2 rounded-lg inline-block ${style } shadow-[3px_3px_0px_rgba(0,0,0,2)]`}>{msg.text}</span></div>
          </div>
      </div>
    </div>
  )

}


export default function Home() {
  const [query, setQuery] = useState('')
  const [messages, setMessages] = useState(Array<MessageType>)
  const [loading, setLoading] = useState(false)

  const addMessage = (msg: MessageType) => {
    const newMessages: Array<MessageType> = messages
    newMessages.push(msg)
    setMessages(newMessages)
    console.log('addMessage', messages)
  }

  async function createIndexAndEmbeddings() {
    try {
      const result = await fetch('/api/setup', {
        method: "POST"
      })
      const json = await result.json()
      console.log('result: ', json)
    } catch (err) {
      console.log('err:', err)
    }
  }


  async function sendQuery() {
    if (!query) return
    setLoading(true)
    addMessage({text: query, type: 'question', date: Date.now()})
    setQuery('')
    try {
      const result = await fetch('/api/read', {
        method: "POST",
        body: JSON.stringify(query)
      })
      const json = await result.json()
      addMessage({ text: json.data, type: 'answer', date: Date.now()})
      setLoading(false)
    } catch (err) {
      console.log('err:', err)
      setLoading(false)
    }
  }




  return (
    <div className="flex h-screen flex-col h-[100svh]">

        <div className="flex-grow overflow-y-auto">
          <div className="flex flex-col space-y-2 p-4">

          <Message key={1111111} text={"Hello I'am Felix Faerber. or rather an AI version of it. Ask me things about me or how I can help you with your software projects. all answers are without guarantee."} type={'answer'} date={1111111}/>
            {messages.map((msg) => {
              return (
                <Message key={msg.date} text={msg.text} type={msg.type} date={msg.date}/>
              )
            })}
            
            {
              loading && <Message key={99999999999} text={'Felix is typing...'} type={'answer'} date={99999999999}/>
            }

          </div>
        </div>

        <div className="flex items-center p-4">
          <input 
            type="text" 
            placeholder="Type your question..." 
            className="placeholder-gray-500 focus:placeholder-white w-full fw-96 border border-black border-2 px-4 py-2 focus:outline-none focus:shadow-[2px_2px_0px_rgba(0,0,0,1)] focus:bg-[#FFA6F6] active:shadow-[2px_2px_0px_rgba(0,0,0,1)] rounded-md" 
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
          <button 
            className="ml-2 border-black border-2 rounded-md bg-blue-500 px-4 py-2 bg-[#A6FAFF] hover:bg-[#79F7FF] hover:shadow-[2px_2px_0px_rgba(0,0,0,1)] active:bg-[#00E1EF]"
            onClick={sendQuery} 
          >SEND</button>
        </div>

      </div>
  )
}