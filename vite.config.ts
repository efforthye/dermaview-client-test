import { defineConfig } from 'vite'
import path from 'node:path'
import electron from 'vite-plugin-electron/simple'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react({
      // TypeScript 타입 체크 비활성화
      typescript: {
        transpileOnly: true,  // 타입 체크 없이 트랜스파일만 수행
      }
    }),
    electron({
      main: {
        entry: 'electron/main.ts',
        vite: {
          build: {
            rollupOptions: {
              external: ['better-sqlite3', 'electron', 'fs', 'path'],
            },
          },
        },
      },
      preload: {
        input: path.join(__dirname, 'electron/preload.ts'),
      },
      renderer: process.env.NODE_ENV === 'test' ? undefined : {},
    }),
  ],
  optimizeDeps: {
    exclude: ['better-sqlite3'], // better-sqlite3를 Vite의 최적화 대상에서 제외
  },
  // TypeScript 설정 
  esbuild: {
    logOverride: { 'this-is-undefined-in-esm': 'silent' },
  },
})