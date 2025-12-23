import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],

  server: {
    headers: {
      "Cross-Origin-Opener-Policy": "same-origin",
      "Cross-Origin-Embedder-Policy": "require-corp",
    },
    proxy: {
      '/faucet-proxy': {
        target: 'https://faucet.testnet-conway.linera.net',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/faucet-proxy/, ''),
        secure: false,
      }
    }
  },

  optimizeDeps: {
    exclude: ['@linera/client', '@linera/signer'],
  },

  worker: {
    format: 'es',
  },
})
