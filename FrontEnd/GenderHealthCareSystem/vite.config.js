import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/api': {
        target: 'http://14.225.192.28:8080/',
        //target: 'http://localhost:8080/',
        changeOrigin: true,
        secure: false
      },
    }
  },

})
