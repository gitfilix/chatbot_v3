import React from 'react'
import './ChatBotStart.css'
import InstallPrompt
 from './InstallPrompt';

const ChatBotStart = ({ onStartChat }) => {

  return (
    <div className='start-page'>
      <button className='start-page-btn' onClick={onStartChat}>Chat with AI v3</button>
      <InstallPrompt />
    </div>

  );
};

export default ChatBotStart;
