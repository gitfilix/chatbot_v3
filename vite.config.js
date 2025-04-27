import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import dotenv from 'dotenv'
dotenv.config()

const isProduction = process.env.NODE_ENV === 'production'
// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],

  server: {
    port: isProduction ? 10000: 5173,
  },
})
