import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import dotenv from 'dotenv'
dotenv.config()

// documentation: https://vite.dev/config/
const isProduction = process.env.NODE_ENV === 'production'
export default defineConfig({
  plugins: [react()],
  server: {
      host: true,
      strictPort: true,
      port: isProduction ? 10000: 5173,
      allowedHosts: [
        'flx-chatbot.local',
        'flx-chatbot.local:10000',
        'flx-chatbot.local:5173',
        'localhost',
        'flx-chatbot-v2.onrender.com'
      ],
  }
})
