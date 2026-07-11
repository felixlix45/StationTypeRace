import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Allow Cloudflare quick tunnels / LAN previews (phone testing without deploy).
    allowedHosts: true,
  },
})
