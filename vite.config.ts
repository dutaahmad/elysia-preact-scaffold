import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'
import preact from '@preact/preset-vite'

export default defineConfig({
  plugins: [tailwindcss(), preact()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      },
      allowedHosts: ['tata-aqi-linux', 'tata-mac']
  },
})
