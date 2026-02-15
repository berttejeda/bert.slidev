import { defineConfig } from 'vite'
import path from 'path'

export default defineConfig({
    resolve: {
        dedupe: ['vue'],
        alias: {
            'vue': path.resolve(__dirname, 'node_modules/vue'),
        },
    },
    server: {
        proxy: {
            '/api': {
                target: 'http://localhost:10001',
                changeOrigin: true,
            },
            '/terminals': {
                target: 'http://localhost:10001',
                changeOrigin: true,
                ws: true,
            },
        }
    }
})
