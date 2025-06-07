import React, { useEffect, useState } from "react"
import { v4 as uuidv4 } from "uuid"
import ChatBotStart from "./Components/ChatBotStart"
import ChatBotApp from "./Components/ChatBotApp"

interface Message {
  type: 'prompt' | 'response';
  text: string;
  timestamp: string;
}

interface Chat {
  id: string;
  displayId: string;
  messages: Message[];
}

const App: React.FC = () => {
  const [isChatting, setIsChatting] = useState<boolean>(false)
  const [chats, setChats] = useState<Chat[]>([])
  const [activeChat, setActiveChat] = useState<string | null>(null)

  useEffect(() => {
    const storedChats = JSON.parse(localStorage.getItem('chats') || '[]')
    setChats(storedChats)
    
    if (storedChats.length > 0) {
      setActiveChat(storedChats[0].id)
    }
  }, [])

  const handleStartChat = () => {

    setTimeout(() => {
      setIsChatting(true)
    }
    , 350)
    
    if (chats.length === 0) {
      createNewChat()
    }
  }

  const handleGoBack = () => {
    setIsChatting(false)
  }

  const createNewChat = (initialMsg: string = '') => {
    const newChat: Chat = {
      id: uuidv4(),
      displayId: `Chat ${new Date().toLocaleDateString('de-DE')} ${new Date().toLocaleTimeString()}`,
      messages: initialMsg
        ? [{
            type: 'prompt',
            text: initialMsg,
            timestamp: new Date().toLocaleTimeString()
          } as Message]
        : [],
    }
    const updatedChats: Chat[] = [newChat, ...chats]
    setChats(updatedChats)
    localStorage.setItem('chats', JSON.stringify(updatedChats))
    localStorage.setItem((newChat.id), JSON.stringify(newChat.messages))
    setActiveChat(newChat.id)
  }

  return (
    <div className='container'>
      {isChatting 
      ? (<ChatBotApp 
          onGoBack={handleGoBack}
          chats={chats}
          setChats={setChats}
          activeChat={activeChat}
          setActiveChat={setActiveChat}
          onNewChat={createNewChat}
          />) 
      : (<ChatBotStart onStartChat={handleStartChat} />)
    }
    </div>
  )
}

export default App
