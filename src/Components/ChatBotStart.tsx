import React from 'react'
import './ChatBotStart.css'
import InstallPrompt from './InstallPrompt'

interface ChatBotStartProps {
  onStartChat: () => void;
}

const ChatBotStart: React.FC<ChatBotStartProps> = ({ onStartChat }) => {

  return (
    <div className='start-page'>
      <button className='start-page-btn' onClick={onStartChat}>Chat with FLX Bot</button>
      <InstallPrompt />
    </div>

  )
}

export default ChatBotStart
