import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { nodePolyfills } from 'vite-plugin-node-polyfills'
import fs from 'fs'
import path from 'path'

const CODEC_PATTERN = /@cornerstonejs\/codec-/

export default defineConfig({
  plugins: [
    nodePolyfills({ include: ['zlib', 'buffer', 'stream', 'util', 'events'] }),
    react(),
    {
      name: 'patch-cornerstone-codecs',
      // 개발 서버: 파일 서빙 시 export default 주입
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          const url = req.url?.split('?')[0] ?? ''
          if (CODEC_PATTERN.test(url) && url.endsWith('.js')) {
            const filePath = path.join(process.cwd(), 'node_modules', url.replace('/node_modules/', ''))
            if (fs.existsSync(filePath)) {
              const code = fs.readFileSync(filePath, 'utf-8')
              const patched = code + '\nexport default typeof module !== "undefined" ? module.exports : {};'
              res.setHeader('Content-Type', 'application/javascript')
              res.end(patched)
              return
            }
          }
          next()
        })
      },
      // 빌드 시: transform 훅으로 동일하게 처리
      transform(code, id) {
        if (CODEC_PATTERN.test(id) && id.endsWith('.js')) {
          return { code: code + '\nexport default typeof module !== "undefined" ? module.exports : {};' }
        }
      },
    },
  ],
  resolve: {
    alias: {
      zlib: 'browserify-zlib',
    },
  },
  server: {
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp',
    },
  },
  optimizeDeps: {
    include: ['dicom-parser'],
    exclude: [
      '@cornerstonejs/dicom-image-loader',
      '@cornerstonejs/codec-charls',
      '@cornerstonejs/codec-libjpeg-turbo-8bit',
      '@cornerstonejs/codec-openjpeg',
      '@cornerstonejs/codec-openjph',
    ],
  },
  build: { target: 'es2022' },
})
