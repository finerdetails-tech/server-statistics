import preact from '@preact/preset-vite'
import {
  defineConfig, loadEnv
} from 'vite'


// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
    base: env.BASE_URL || '/',
    envPrefix: 'VISIBLE_',
    plugins: [ preact() ]
  }
})
