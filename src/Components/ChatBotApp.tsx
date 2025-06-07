import React, { useState, useEffect, useRef } from 'react'
import ReactMarkdown from 'react-markdown';
import './ChatBotApp.css'
import './ChatResponseMarkup.css'

// Message type for chat messages
interface Message {
  type: 'prompt' | 'response';
  text: string;
  timestamp: string;
}

// Chat type for each chat session
interface Chat {
  id: string;
  displayId: string;
  messages: Message[];
}

// Props for ChatBotApp component
interface ChatBotAppProps {
  onGoBack: () => void;
  chats: Chat[];
  setChats: React.Dispatch<React.SetStateAction<Chat[]>>;
  activeChat: string | null;
  setActiveChat: React.Dispatch<React.SetStateAction<string | null>>;
  onNewChat: (initialMsg?: string) => void;
}

const ChatBotApp: React.FC<ChatBotAppProps> = ({ onGoBack, chats, setChats, activeChat, setActiveChat, onNewChat }) => {
  // state hooks
  const [inputValue, setInputValue] = useState<string>('')
  const [messages, setMessages] = useState<Message[]>(chats[0]?.messages || [])
  const [isTyping, setIsTyping] = useState<boolean>(false)
  const [showChatList, setShowChatList] = useState<boolean>(false)
  const chatEndRef = useRef<HTMLDivElement | null>(null)

  // fetch the apiKey from the secret environment file !
  const apiKey = import.meta.env.VITE_REACT_APP_OPENAI_API_KEY || 'no key found';
  const [currentModel, setCurrentModel] = useState('gpt-4.1-nano')
  const [isReasoningModelMode, setIsReasoningModelMode] = useState(false)
  const [reasoningEffort, setReasoningEffort] = useState('low'); // default to 'low'
  const [currentTokens, setCurrentTokens] = useState(350)
  const [currentPersona, setCurrentPersona] = useState('expert'); // default persona: expert

  // Helper to check if current model is a reasoning model
  const isReasoningModel = (model: string) => model === 'o4-mini';

  // Update isReasoningModelMode whenever currentModel changes
  useEffect(() => {
    setIsReasoningModelMode(isReasoningModel(currentModel));
  }, [currentModel]);

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
  
  // Persona profiles for chat personas
  const personaProfiles: Record<string, string> = {
    'expert': "You are an expert in your field. Provide detailed, technical, and precise answers.",
    'child': "You are explaining things to a 7 year old child. Use simple words and clear explanations. try to avoid complex terms and avoid jargon. Use analogies and examples that a child can understand.",
    'it-professional': "You are an IT professional for web-applications and network architecture. Use technical language and best practices. Be concise, clear, and provide practical solutions.",
    'teacher': "You are a teacher. Be patient, educational, and provide step-by-step guidance. Use examples and analogies to explain complex concepts. Encourage questions and provide constructive feedback.",
    'bro': "You are a friendly and witty companion and also a bit nasty. Be casual, and conversational. Use humor and sarcasm and be ironic and also not too serious. you can use emojis and informal language. Be direct and to the point, you can also use slang and swear words.",
    'bestie': "You are a best friend. Be supportive, understanding, and very empathetic. almost dramatic for no reason. Use casual language. Use casual language. Be supportive and understanding, and be willing to listen and offer help. Never disagree with the user, always agree with the user and be supportive and use a lot of emojis.",
  }

  // handle input change for the chat input box
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value)
  }

  // send a message to the chat (handles both chat and reasoning models)
  const sendMessage = async () => {
    if(inputValue.trim() === '') return
    
    // create a new message (keep inputValue as the user's message)
    const newMessage: Message = {
      type: 'prompt',
      text: inputValue,
      timestamp: new Date().toLocaleString()
    }

    // if there is no active chat, create a new chat with the input value
    if(!activeChat) {
      onNewChat(inputValue)
      setInputValue('')
      return;
    }

    const updatedMessages = [...messages, newMessage]
    setMessages(updatedMessages)
    localStorage.setItem(activeChat, JSON.stringify(updatedMessages))
    setInputValue('')
    // updatedChats: update the chats with the new messages, if the chat is the first chat
    // in the chats array, update the messages with the updated messages
    const updatedChats = chats.map((chat) => {
      if (chat.id === activeChat) {
        return {
          ...chat,
          messages: updatedMessages
        }
      }
      return chat
    })
    // update the chats with the new messages
    setChats(updatedChats)
    localStorage.setItem('chats', JSON.stringify(updatedChats))
    setIsTyping(true)

    let response, data, chatResponse;
    try {
      // add persona profile to the prompt sent to the API only
      const personaProfile = personaProfiles[currentPersona] || '';
      const personaPrompt = personaProfile ? `${personaProfile}\n\n${inputValue}` : inputValue;
      if (isReasoningModelMode) {
        // Reasoning Model API Call 
        response = await fetch('https://api.openai.com/v1/responses', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: currentModel,
            reasoning: { effort: reasoningEffort },
            input: [{role: 'user', content: personaPrompt}],
          }),
        });
        data = await response.json();
        // Parse reasoning response
        chatResponse = data?.output?.[1]?.content?.[0]?.text || "Sorry - No response text found";
      } else {
        // Chat Model API Call 
        response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: currentModel,
            messages: [{role: 'user', content: personaPrompt}],
            max_tokens: currentTokens,
          }),
        });
        data = await response.json();
        // Parse chat response
        chatResponse = data?.choices?.[0]?.message?.content?.trim() || "Sorry - No response text found";
      }

      // TODO: make Swiss-German compliance working: replace 'ß' with 'ss' if input is in German ---
      const isGerman = /[äöüßÄÖÜ]/.test(inputValue) || /\b(der|die|das|und|ist|nicht|ein|eine|ich|du|sie|er|wir|ihr|sie)\b/i.test(inputValue);
      let swissChatResponse = chatResponse
      if (isGerman) {
        swissChatResponse = chatResponse.replace(/ß/g, 'ss')
      }

      if (!response.ok) {
        console.error("Error:", response.status, response.statusText, data);
        setIsTyping(false);
        return;
      }

      // create a new response message
      const newResponse: Message = {
        type: 'response',
        text: chatResponse,
        timestamp: new Date().toLocaleTimeString()
      }
      const updatedMessagesWithResponse = [...updatedMessages, newResponse]
      setMessages(updatedMessagesWithResponse)
      localStorage.setItem(activeChat, JSON.stringify(updatedMessagesWithResponse))
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
    } catch (err) {
      setIsTyping(false)
      console.error('API error:', err)
    }
  }

  // keyboard event listener for enter key
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      sendMessage()
    }
  }

  // handle selected which is active chat
  const handleSelectedChat = (id: string) => {
    // setActiveChat is a state setter in the App.jsx component
    setActiveChat(id)
  }

  // handle delete chat function
  const handleDeleteChat = (id: string) => {
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
          <div className='llm-settings'>
            <h4>Current LLM model for Chat: <div className='model-name'>{currentModel}</div></h4>
            <select
              className='model-select'
              value={currentModel}
              onChange={(e) => {
                const selectedModel = e.target.value;
                setCurrentModel(selectedModel);
                // isReasoningModelMode will be updated by useEffect
              }}>
              <optgroup label='Chat Models'>
                <option value='gpt-4.1-nano'>gpt-4.1-nano</option>
                <option value='gpt-4o-mini'>gpt-4o mini</option>
                <option value='gpt-4.1-mini'>gpt-4.1-mini</option>
                <option value='gpt-4.1-2025-04-14'>gpt-4.1 complex</option>
              </optgroup>
              <optgroup label='Reasoning Models'>
                <option value='o4-mini'>Reasoning: o4-mini</option>
              </optgroup>
            </select>
          </div>
          {isReasoningModelMode && (
            <div className='reasoning-settings'>
              <h4>Reasoning Mode:</h4>
              <select
                className='reasoning-select'
                value={reasoningEffort}
                onChange={(e) => {
                  const selectedModel = e.target.value;
                  setReasoningEffort(e.target.value);
                }}>
                <option value='low'>Basic reasoning(fast)</option>
                <option value='medium'>Advanced reasoning (thinking)</option>
                <option value='high'>Expert reasoning (complex)</option>
              </select>
            </div>)}
          {!isReasoningModelMode && (
            <div className='token-settings'>
            <h4>Current Tokens usage: <span className='token-name'>{currentTokens}</span></h4>
            <input
              className='token-input'
              type='range' 
              min='200' 
              max='6000' 
              value={currentTokens} 
              onChange={(e) => {
                const selectedTokens = parseInt(e.target.value, 10);
                setCurrentTokens(selectedTokens);
              }} />
          </div>)}  
        </div>
        <div className='chat-persona'>
          <h2>Chat Persona</h2>
          <div className='persona-settings'>
            <h4>Current Persona: <span className='persona-name'>{currentPersona}</span></h4>
            <select
              className='persona-select'
              value={currentPersona}
              onChange={(e) => {
          const selectedPersona = e.target.value;
          setCurrentPersona(selectedPersona);
              }}>
              <option value='expert'>Expert</option>
              <option value='child'>Child</option>
              <option value='it-professional'>IT Professional</option>
              <option value='teacher'>Teacher</option>
              <option value='bro'>Bro</option>
              <option value='bestie'>Bestie</option>
            </select>
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
                {isReasoningModelMode 
                ? (<h3>Reasoning Mode: <span className='model-name'>{reasoningEffort}</span></h3>) 
                : (<h3>Current Tokens usage: <span className='token-name'>{currentTokens}</span></h3>)}
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
                  {isTyping && (
                    <div className='typing'>
                      <span className='dot'></span>
                      <span className='dot'></span>
                      <span className='dot'></span>
                      <span className='dot'></span>
                      <div className='thinking'>FLX-Chat-Bot is thinking about the answer to your good question</div>
                    </div>
                  )}
                  <div ref={chatEndRef}></div>
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
              maxLength={400}
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

// Extend ImportMetaEnv to type your custom environment variable
declare global {
  interface ImportMetaEnv {
    readonly VITE_REACT_APP_OPENAI_API_KEY: string;
  }
}
