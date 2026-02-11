import preact from '@preact/preset-vite'
import { defineConfig } from 'vite'

// https://vitejs.dev/config/
export default defineConfig({
  envPrefix: 'VISIBLE_',
  plugins: [ preact() ]
})
