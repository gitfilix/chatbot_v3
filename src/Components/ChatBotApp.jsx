import React, { useState, useEffect, useRef } from 'react'
import ReactMarkdown from 'react-markdown';
import './ChatBotApp.css'

const ChatBotApp = ({ onGoBack, chats, setChats, activeChat, setActiveChat, onNewChat }) => {
  // state hooks
  const [inputValue, setInputValue] = useState('')
  const [messages, setMessages] = useState(chats[0]?.messages || [])
  const [isTyping, setIsTyping] = useState(false)
  const [showChatList, setShowChatList] = useState(false)
  const chatEndRef = useRef(null)

  // fetch the apiKey from the local .env file !
  const apiKey = import.meta.env.VITE_REACT_APP_OPENAI_API_KEY || 'no key found';
  const [currentModel, setCurrentModel] = useState('gpt-3.5-turbo')
  const [currentTokens, setCurrentTokens] = useState(250)

  useEffect(() => {
    // get the active chat object
    const activeChatObj = chats.find(chat => chat.id === activeChat)
    // set the messages to the active chat messages or an empty array if no active chat are available
    setMessages(activeChatObj ? activeChatObj.messages : [])
  }, [activeChat, chats])
  
  useEffect(() => {
    if (activeChat){
      const storedLocalStoreMessages = JSON.parse(localStorage.getItem(activeChat) || '[]')
      setMessages(storedLocalStoreMessages)
    }
  }, [activeChat])
  

  const handleInputChange = (e) => {
    setInputValue(e.target.value)
  }

  const sendMessage = async () => {
    if(inputValue.trim() === '') return
    
    // create a new message
    const newMessage = {
      type: 'prompt',
      text: inputValue,
      timestamp: new Date().toLocaleString()
    }

    // if there is no active chat, create a new chat with the input value
    if(!activeChat) {
      onNewChat(inputValue)
      setInputValue('')
    } else {
      // if there is an active chat, get the messages of the active chat
      const updatedMessages = [...messages, newMessage]
      setMessages(updatedMessages)
      localStorage.setItem(activeChat, JSON.stringify(updatedMessages))
      // clear the input field by setting the input field value to an empty string
      setInputValue('')
  
      // updatedChats: update the chats with the new messages, if the chat is the first chat
      // in the chats array, update the messages with the updated messages
      const updatedChats = chats.map((chat) => {
        // if the chat is the active chat in the chats array we update the messages
        if (chat.id === activeChat) {
          return {
            ...chat,
            messages: updatedMessages
          }
        }
        // otherwise we return the chat as it is
        return chat
      })
      setChats(updatedChats)
      localStorage.setItem('chats', JSON.stringify(updatedChats))
      setIsTyping(true)
      console.log('using the model:', currentModel)
      // fetch response from openAi 
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: currentModel,
          messages: [{role: 'user', content: inputValue}],
          max_tokens: currentTokens,
        }),
      })
      console.log('Response:', response)
      // data response from the fetch request
      const data = await response.json();
      
      // Check for errors
      if (!response.ok) {
        console.error("Error:", response.status, response.statusText, data);
        return;
      }
 
      // mostly the response is in the first choice and removes the leading and trailing whitespaces
      const chatResponse = data.choices[0].message.content.trim();
      console.log('Chat response:', chatResponse)
      // create a new response message (internal message type response)
      const newResponse = {
        type: 'response',
        text: chatResponse,
        timestamp: new Date().toLocaleTimeString()
      }

      // update the messages with the new response from Chat-GPT
      const updatedMessagesWithResponse = [...updatedMessages, newResponse]
      setMessages(updatedMessagesWithResponse)
      localStorage.setItem(activeChat, JSON.stringify(updatedMessagesWithResponse))
      // thinking period is over - no more typing
      setIsTyping(false)

      // update and add the curretn chatId with the new messages: updatedMessagesWithResponse
      const updatedChatsWithResponse = chats.map((chat) => {
        if (chat.id === activeChat) {
          return {
            ...chat,
            messages: updatedMessagesWithResponse
          }
        }
        // return the chat as it is
        return chat
      })
      // update the chats with the new response from Chat-GPT
      setChats(updatedChatsWithResponse)
      localStorage.setItem('chats', JSON.stringify(updatedChatsWithResponse))
    }
  }


  // keyboard event listener for enter key
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      sendMessage()
    }
  }

  // handle selected which is active chat
  const handleSelectedChat = (id) => {
    // setActiveChat is a state setter in the App.jsx component
    setActiveChat(id)
  }

  // handle delete chat function
  const handleDeleteChat = (id) => {
    // filter out the chat with the id to be deleted (all chats except the chat with the id)
    const updatedChats = chats.filter((chat) => chat.id !== id)
    setChats(updatedChats)
    // save the updated chats to the local storage and remove the chat with the id to be deleted
    localStorage.setItem('chats', JSON.stringify(updatedChats))
    localStorage.removeItem(id)

    // if the chat to be deleted is the active chat, set the active chat to the first chat in the updated chats
    if(id === activeChat) {
      const newActiveChat = updatedChats.length > 0 ? updatedChats[0].id : null
      setActiveChat(newActiveChat)
    }
  }

  // scroll to the end of the chat window: chatEndRef is a reference to the last message in the chat window
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])


  return (
    <div className='chat-app'>
      <div className={`chat-list ${showChatList ? 'show' : ''}`}>
        <div className='chat-list-header'>
          <h2>Menu</h2>
          <i className='bx bx-x-circle close-list'
            onClick={() => setShowChatList(false)}>
          </i>
        </div>
        <div className='chat-list-header'>
          <h2>New Chat</h2>
          <i className='bx bx-message-add new-chat'
            onClick={() => onNewChat(inputValue)}>
          </i>
        </div>
        <div className='chat-settings'>
          <h2>API Settings</h2>
          <div className='llm-settings' >
            <h4>Current LLM model: <div className='model-name'>{currentModel}</div></h4>
              <select 
            // Update the current model in the state
              className='model-select' 
              value={currentModel} 
              onChange={(e) => {
                const selectedModel = e.target.value;
                setCurrentModel(selectedModel);
              }}>
              <option value='gpt-3.5-turbo'>gpt-3.5-turbo</option>
              <option value='gpt-4.0-turbo'>gpt-4.0-turbo</option>
              <option value='gpt-4.1-nano'>gpt-4.1-nano</option>
              <option value='gpt-4o-mini'>gpt-4o mini</option>
              <option value='gpt-4.1-mini'>gpt-4.1-mini</option>
              <option value='gpt-4.1-2025-04-14'>gpt-4.1 complex</option>
              </select>
          </div>
            <div className='token-settings'>
              <h4>Current Tokens usage: <span className='token-name'>{currentTokens}</span></h4>
              <input
              className='token-input'
              type='range' 
              min='100' 
              max='4000' 
              value={currentTokens} 
              onChange={(e) => {
                const selectedTokens = parseInt(e.target.value, 10); // Ensure it's a number
                setCurrentTokens(selectedTokens);
              }} />
          </div>
        </div>
        <div className='chat-list-header'>
        <h2>Chat List</h2>
        </div>
        {chats.map((chat) => (
            <div 
              key={chat.id} 
              className={`chat-list-item ${chat.id === activeChat ? 'active' : ''}`}
              onClick={() => handleSelectedChat(chat.id)}
              >
              <h4>Chat display Id:{chat.displayId}</h4>
              <i 
                className='bx bx-x-circle'
                onClick={(e)=> {
                  e.stopPropagation()
                  handleDeleteChat(chat.id)
                }}></i>
              </div>
            ))}
            </div>
            <div className='chat-window'>
            <div className='chat-title'>
              <h2>FLX-Chat</h2>
              <div className='header-info'>
                <div >
                  <h3>LLM model: <span className='model-name'>{currentModel}</span></h3>
                </div>
                  <div>
                    <h3>Current Tokens: <span className='token-name'>{currentTokens}</span></h3>
                </div>
               </div>
               <div className='menu-icon-container'>              
                  <i className='bx bx-menu'
                  onClick={() => setShowChatList(true)}></i>
                  <i className='bx bx-arrow-back arrow'
                  onClick={onGoBack}>
                  </i>
                  </div>
                </div>
                <div className='chat'>
                  {messages.map((msg, index) => (
                  <div key={index} className={msg.type === 'prompt' ? 'prompt' : 'response'}>
                    <span className="chat-response">
                      <ReactMarkdown>{msg.text}</ReactMarkdown>
                  </span>
                  <span>{msg.timestamp}</span>
                  </div>
                  ))}
                  {isTyping && <div className='typing'>FLX Bot is thinking about the answer to your question...</div>}
                  <div ref={chatEndRef} ></div>
                </div>
                <form className='msg-form'
                  onSubmit={(e) => {
            e.preventDefault()
            sendMessage()
          }}>
          <div className='input-container'>
            <input 
              type='text' 
              placeholder='Ask me anything... FLX chatbot may answer your question'  
              className='msg-input'
              minLength={5}
              maxLength={200}
              value={inputValue} 
              onChange={handleInputChange} 
              onKeyDown={handleKeyDown}
              />
            <i 
              className='fa-solid fa-paper-plane' 
              onClick={sendMessage}>
              </i>
          </div>  
        </form>
      </div>
    </div>
  )
}

export default ChatBotApp
