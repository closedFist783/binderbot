import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const tcgKey = env.VITE_TCG_API_KEY || ''

  return {
    plugins: [react()],
    server: {
      proxy: {
        '/api': {
          target: 'http://localhost:5001',
          changeOrigin: true,
        },
        '/tcg': {
          target: 'https://api.pokemontcg.io',
          changeOrigin: true,
          rewrite: path => path.replace(/^\/tcg/, '/v2'),
          headers: tcgKey ? { 'X-Api-Key': tcgKey } : {},
        },
      },
    },
  }
})
