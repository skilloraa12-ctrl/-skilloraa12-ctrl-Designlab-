import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: '/-skilloraa12-ctrl-Designlab-/',
  plugins: [react()],
  server: {
    port: 5173
  }
})
