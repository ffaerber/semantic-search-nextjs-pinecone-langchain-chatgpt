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
    <div className="flex h-screen flex-col">


        <div id="messages" className="flex flex-col space-y-4 p-3 overflow-y-auto scrollbar-thumb-blue scrollbar-thumb-rounded scrollbar-track-blue-lighter scrollbar-w-2 scrolling-touch">          

        </div>



        <div className="flex-grow overflow-y-auto">
          <div className="flex flex-col space-y-2 p-4">


          <Message key={1111111} text={"Hello I'am a Felix Faerber. or rather an AI version of it. ask me how I can help you with a software development. all answers are without guarantee. "} type={'answer'} date={1111111}/>
          {messages.map((msg) => {
            return (
              <Message key={msg.date} text={msg.text} type={msg.type} date={msg.date}/>
            )
          })}
          {
            loading && <Message key={99999999999} text={'felixAI is typing...'} type={'answer'} date={99999999999}/>
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

        {/* <div className="border-t-2 border-gray-200 px-4 pt-4 mb-2 sm:mb-0">
          <div className="relative flex">
            <input type="text" 
                  placeholder="Write your question!" 
                  value={query} 
                  onChange={e => setQuery(e.target.value)} 
                  className="placeholder-gray-500 focus:placeholder-white mr-20 w-full fw-96 border-black border-2 p-2.5 focus:outline-none focus:shadow-[2px_2px_0px_rgba(0,0,0,1)] focus:bg-[#FFA6F6] active:shadow-[2px_2px_0px_rgba(0,0,0,1)] rounded-md"/>
            
            <div className="absolute right-0 items-center sm:flex">
              <button type="button" onClick={createIndexAndEmbeddings} className="inline-flex items-center justify-center rounded-full h-10 w-10 transition duration-500 ease-in-out text-gray-500 hover:bg-gray-300 focus:outline-none">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="h-6 w-6 text-gray-600">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
              </button>
              <button type="button" onClick={sendQuery} className="h-12 border-black border-2 p-2.5 bg-[#A6FAFF] hover:bg-[#79F7FF] hover:shadow-[2px_2px_0px_rgba(0,0,0,1)] active:bg-[#00E1EF] rounded-md">
                <span className="font-bold">Send</span>
              </button>
            </div>
          </div>
        </div> */}

      </div>
  )
}