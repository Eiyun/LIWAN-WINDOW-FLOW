import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // Relative asset URLs work both on a GitHub project page and on a custom domain.
  base: './',
  server: { host: '0.0.0.0', port: 5173 },
})
