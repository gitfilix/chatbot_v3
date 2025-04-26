import React, { useEffect, useState } from "react"
import { v4 as uuidv4 } from "uuid"
import ChatBotStart from "./Components/ChatBotStart"
import ChatBotApp from "./Components/ChatBotApp"

const App = () => {

  const apiKey = import.meta.env || '';
  // chat state: switching view between chat start and chat app
  const [isChatting, setIsChatting] = useState(false)
  // chat state handle
  const [chats, setChats] = useState([])
  // keep track of the active chat
  const [activeChat, setActiveChat] = useState(null)

  useEffect(() => {
    // get the chats from the local storage
    const storedChats = JSON.parse(localStorage.getItem('chats') || '[]')
    // if there are saved chats, set the chats to the saved chats
    setChats(storedChats)
    
    if (storedChats.length > 0) {
      setActiveChat(storedChats[0].id)
    }
  }, [])

  const handleStartChat = () => {

    // TODO: lets wait for 250ms before we start chatting
    setTimeout(() => {
      setIsChatting(true)
    }
    , 350)
    // setIsChatting(true)
    
    if (chats.length === 0) {
      createNewChat()
    }
  }

  const handleGoBack = () => {
    setIsChatting(false)
  }

  // create a new chat (whole chat-interaction on the left in the UI) with an initial message
  const createNewChat = (initialMsg = '') => {
    // create a new chat object
    const newChat = {
      id: uuidv4(),
      displayId: `Chat ${new Date().toLocaleDateString('de-DE')} ${new Date().toLocaleTimeString()}`,
      messages: 
        initialMsg 
        ? [{
          type: 'prompt',
          text: initialMsg, 
          timestamp: new Date().toLocaleTimeString()}]
        : [],
    }

    const updatedChats = [newChat, ...chats]
    setChats(updatedChats)
    // save the chats to the local storage
    localStorage.setItem('chats', JSON.stringify(updatedChats))
    // save the messages of the current chat.id to the local storage
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
